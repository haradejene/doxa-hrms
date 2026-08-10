<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Support\EthiopianCalendar;
use App\Support\EthiopianPayrollTax;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    /** Employee statuses that earn a salary. */
    private const PAYABLE_STATUSES = ['active', 'on_leave', 'probation'];

    /**
     * The payroll sheet for a single month.
     *
     * A month that has already been processed is read back from payroll_items
     * exactly as it was recorded. A month that has not been processed yet is
     * calculated on the fly as a draft so HR can review it before running.
     */
    public function index(Request $request)
    {
        $period = $this->resolvePeriod($request);
        $run    = PayrollRun::with('items')->where('period_key', $period->format('Y-m'))->first();

        $records = $run
            ? $this->recordsFromRun($run)
            : $this->draftRecords($period);

        return response()->json($this->sheet($period, $records, $run));
    }

    /**
     * Run payroll for the whole month in one go: every eligible employee is
     * calculated and written in a single transaction.
     */
    public function process(Request $request)
    {
        $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
            'force'  => ['nullable', 'boolean'],
        ]);

        $period = $this->resolvePeriod($request);
        $key    = $period->format('Y-m');
        $force  = $request->boolean('force');

        $existing = PayrollRun::where('period_key', $key)->first();

        if ($existing && ! $force) {
            return response()->json([
                'message' => 'Payroll for this month has already been processed. Re-run it to recalculate.',
                'period'  => $key,
            ], 409);
        }

        $records = $this->draftRecords($period);

        if ($records->isEmpty()) {
            return response()->json([
                'message' => 'No payable employees found for this month.',
                'period'  => $key,
            ], 422);
        }

        $run = DB::transaction(function () use ($period, $key, $records, $existing) {
            $processedAt = now();
            $eth         = EthiopianCalendar::describe($period->copy()->endOfMonth());

            $run = $existing ?: new PayrollRun();
            $run->fill([
                'name'                   => sprintf('%s %d E.C — %s', $eth['month_name'], $eth['year'], $period->format('F Y')),
                'period'                 => 'monthly',
                'period_key'             => $key,
                'start_date'             => $period->copy()->startOfMonth()->toDateString(),
                'end_date'               => $period->copy()->endOfMonth()->toDateString(),
                'payment_date'           => $period->copy()->endOfMonth()->toDateString(),
                'total_gross_pay'        => $records->sum('gross_pay'),
                'total_deductions'       => $records->sum('total_deductions'),
                'total_income_tax'       => $records->sum('income_tax'),
                'total_pension_employee' => $records->sum('pension_employee'),
                'total_pension_employer' => $records->sum('pension_employer'),
                'total_net_pay'          => $records->sum('net_pay'),
                'employee_count'         => $records->count(),
                'status'                 => 'approved',
                'processed_at'           => $processedAt,
            ]);
            $run->save();

            // A re-run replaces the previous figures wholesale.
            PayrollItem::where('payroll_run_id', $run->id)->delete();

            foreach ($records as $r) {
                PayrollItem::create([
                    'payroll_run_id'        => $run->id,
                    'employee_id'           => $r['employee_id'],
                    'employee_name'         => $r['employee_name'],
                    'employee_number'       => $r['employee_number'],
                    'position_title'        => $r['position'],
                    'hire_date'             => $r['hire_date'],
                    'period_start'          => $r['period_start'],
                    'period_end'            => $r['period_end'],
                    'base_salary'           => $r['basic_salary'],
                    'allowances'            => $r['allowances'],
                    'transport_allowance'   => $r['transport_allowance'],
                    'non_taxable_allowance' => $r['non_taxable_allowance'],
                    'bonuses'               => $r['bonus'],
                    'overtime_pay'          => $r['overtime'],
                    'gross_pay'             => $r['gross_pay'],
                    'taxable_income'        => $r['taxable_income'],
                    'deductions'            => $r['other_deductions'],
                    'tax'                   => $r['income_tax'],
                    'pension_employee'      => $r['pension_employee'],
                    'pension_employer'      => $r['pension_employer'],
                    'net_pay'               => $r['net_pay'],
                    'components'            => [
                        'days_paid'      => $r['days_paid'],
                        'days_in_period' => $r['days_in_period'],
                        'tax_rate'       => $r['tax_rate'],
                        'breakdown'      => $r['components'],
                    ],
                ]);
            }

            return $run->fresh('items');
        });

        return response()->json([
            'message'   => sprintf('Payroll processed for %d employees.', $run->employee_count),
            'period'    => $key,
            'processed' => $run->employee_count,
            'sheet'     => $this->sheet($period, $this->recordsFromRun($run), $run),
        ]);
    }

    /**
     * Months available in the switcher: the last two years plus anything that
     * has actually been processed, newest first.
     */
    public function periods()
    {
        $runs = PayrollRun::whereNotNull('period_key')
            ->get()
            ->keyBy('period_key');

        $keys = collect();
        $cursor = now()->startOfMonth();

        for ($i = 0; $i < 24; $i++) {
            $keys->push($cursor->copy()->subMonths($i)->format('Y-m'));
        }

        $keys = $keys->merge($runs->keys())->unique()->sortDesc()->values();

        return response()->json(
            $keys->map(function ($key) use ($runs) {
                $date = self::monthStart($key);
                $run  = $runs->get($key);

                return [
                    'period'       => $key,
                    'label'        => $date->format('F Y'),
                    'ethiopian'    => EthiopianCalendar::describe($date->copy()->endOfMonth()),
                    'status'       => $run ? 'processed' : 'draft',
                    'processed_at' => $run?->processed_at?->toIso8601String(),
                    'total_net'    => $run ? (float) $run->total_net_pay : null,
                ];
            })
        );
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    private function resolvePeriod(Request $request): Carbon
    {
        $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $request->input('period');

        return $period
            ? self::monthStart($period)
            : now()->startOfMonth();
    }

    /** "2026-08" -> the first day of that month. */
    private static function monthStart(string $key): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', $key . '-01')->startOfDay();
    }

    /**
     * Envelope shared by index() and process(): header details, rows, totals.
     */
    private function sheet(Carbon $period, $records, ?PayrollRun $run): array
    {
        $start = $period->copy()->startOfMonth();
        $end   = $period->copy()->endOfMonth();

        return [
            'period'       => $period->format('Y-m'),
            'period_label' => $period->format('F Y'),
            'period_start' => $start->toDateString(),
            'period_end'   => $end->toDateString(),
            'ethiopian'    => [
                'start' => EthiopianCalendar::describe($start),
                'end'   => EthiopianCalendar::describe($end),
            ],
            'employer'     => config('payroll.employer'),
            'currency'     => config('payroll.currency'),
            'status'       => $run ? 'processed' : 'draft',
            'processed_at' => $run?->processed_at?->toIso8601String(),
            'payment_date' => $run?->payment_date?->toDateString() ?? $end->toDateString(),
            'records'      => $records->values(),
            'totals'       => [
                'employees'        => $records->count(),
                'basic_salary'     => round($records->sum('basic_salary'), 2),
                'allowances'       => round($records->sum('allowances'), 2),
                'overtime'         => round($records->sum('overtime'), 2),
                'bonus'            => round($records->sum('bonus'), 2),
                'gross_pay'        => round($records->sum('gross_pay'), 2),
                'taxable_income'   => round($records->sum('taxable_income'), 2),
                'income_tax'       => round($records->sum('income_tax'), 2),
                'pension_employee' => round($records->sum('pension_employee'), 2),
                'pension_employer' => round($records->sum('pension_employer'), 2),
                'other_deductions' => round($records->sum('other_deductions'), 2),
                'total_deductions' => round($records->sum('total_deductions'), 2),
                'net_pay'          => round($records->sum('net_pay'), 2),
            ],
        ];
    }

    /** Read a processed run back as sheet rows. */
    private function recordsFromRun(PayrollRun $run)
    {
        return $run->items
            ->sortBy('employee_name')
            ->values()
            ->map(function (PayrollItem $item, int $i) use ($run) {
                $meta = $item->components ?? [];

                return [
                    'no'                    => $i + 1,
                    'id'                    => $item->id,
                    'employee_id'           => $item->employee_id,
                    'employee_name'         => $item->employee_name,
                    'employee_number'       => $item->employee_number,
                    'position'              => $item->position_title,
                    'hire_date'             => $item->hire_date?->toDateString(),
                    'period_start'          => $item->period_start?->toDateString()
                                                ?? $run->start_date?->toDateString(),
                    'period_end'            => $item->period_end?->toDateString()
                                                ?? $run->end_date?->toDateString(),
                    'payment_date'          => $run->payment_date?->toDateString(),
                    'basic_salary'          => (float) $item->base_salary,
                    'allowances'            => (float) $item->allowances,
                    'transport_allowance'   => (float) $item->transport_allowance,
                    'non_taxable_allowance' => (float) $item->non_taxable_allowance,
                    'overtime'              => (float) $item->overtime_pay,
                    'bonus'                 => (float) $item->bonuses,
                    'gross_pay'             => (float) $item->gross_pay,
                    'taxable_income'        => (float) $item->taxable_income,
                    'income_tax'            => (float) $item->tax,
                    'tax_rate'              => $meta['tax_rate'] ?? EthiopianPayrollTax::marginalRate((float) $item->taxable_income),
                    'pension_employee'      => (float) $item->pension_employee,
                    'pension_employer'      => (float) $item->pension_employer,
                    'other_deductions'      => (float) $item->deductions,
                    'deduction_notes'       => $item->notes,
                    'total_deductions'      => round((float) $item->tax + (float) $item->pension_employee + (float) $item->deductions, 2),
                    'net_pay'               => (float) $item->net_pay,
                    'processed_date'        => $run->processed_at?->toDateString(),
                    'components'            => $meta['breakdown'] ?? [],
                ];
            });
    }

    /**
     * Calculate the month from scratch for every eligible employee.
     */
    private function draftRecords(Carbon $period)
    {
        $start = $period->copy()->startOfMonth();
        $end   = $period->copy()->endOfMonth();

        $employees = Employee::with('position')
            ->whereIn('status', self::PAYABLE_STATUSES)
            ->whereDate('hire_date', '<=', $end)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $components = $this->componentsForPeriod($employees->pluck('id'), $start, $end);

        return $employees
            ->map(fn(Employee $e) => $this->calculate($e, $components->get($e->id, collect()), $start, $end))
            ->sortBy('employee_name')
            ->values()
            ->map(function (array $row, int $i) {
                $row['no'] = $i + 1;
                return $row;
            });
    }

    /**
     * Recurring salary components in force during the period, plus one-off
     * components dated inside it, grouped by employee.
     */
    private function componentsForPeriod($employeeIds, Carbon $start, Carbon $end)
    {
        if (! DB::getSchemaBuilder()->hasTable('salary_components')) {
            return collect();
        }

        return DB::table('salary_components')
            ->whereIn('employee_id', $employeeIds)
            ->whereDate('effective_date', '<=', $end)
            ->where(function ($q) use ($start, $end) {
                $q->where(function ($q) use ($start) {
                    $q->where('is_recurring', true)
                      ->where(function ($q) use ($start) {
                          $q->whereNull('end_date')->orWhereDate('end_date', '>=', $start);
                      });
                })->orWhere(function ($q) use ($start, $end) {
                    $q->where('is_recurring', false)
                      ->whereDate('effective_date', '>=', $start)
                      ->whereDate('effective_date', '<=', $end);
                });
            })
            ->get()
            ->groupBy('employee_id');
    }

    /**
     * One employee's row: earnings, Ethiopian income tax, pension, net pay.
     */
    private function calculate(Employee $employee, $components, Carbon $start, Carbon $end): array
    {
        $daysInPeriod = $end->day;

        // Somebody who joined mid-month is paid for the days they were on staff.
        $hireDate  = $employee->hire_date ? Carbon::parse($employee->hire_date) : null;
        $firstPaid = $hireDate && $hireDate->greaterThan($start) ? $hireDate : $start;
        $daysPaid  = $firstPaid->diffInDays($end) + 1;
        $daysPaid  = max(0, min($daysPaid, $daysInPeriod));

        $fullSalary = (float) ($employee->base_salary ?? 0);

        if (config('payroll.base_salary_basis') === 'annual') {
            $fullSalary /= 12;
        }

        $basic = round($fullSalary * $daysPaid / $daysInPeriod, 2);

        $transport   = 0.0;
        $allowances  = 0.0;
        $bonus       = 0.0;
        $overtime    = 0.0;
        $otherDeduct = 0.0;
        $breakdown   = [];

        foreach ($components as $c) {
            $amount = (float) $c->amount;
            $name   = (string) $c->component_name;
            $type   = strtolower((string) $c->component_type);

            $breakdown[] = ['name' => $name, 'type' => $type, 'amount' => $amount];

            if ($type === 'allowance') {
                // Transport allowance is tracked apart because part of it is tax exempt.
                if (str_contains(strtolower($name), 'transport')) {
                    $transport += $amount;
                } else {
                    $allowances += $amount;
                }
            } elseif ($type === 'bonus') {
                $bonus += $amount;
            } elseif ($type === 'overtime') {
                $overtime += $amount;
            } elseif ($type === 'deduction') {
                $otherDeduct += $amount;
            }
        }

        $gross      = round($basic + $allowances + $transport + $bonus + $overtime, 2);
        $nonTaxable = EthiopianPayrollTax::exemptTransportAllowance($transport, $basic);
        $taxable    = round(max(0, $gross - $nonTaxable), 2);

        $incomeTax = EthiopianPayrollTax::incomeTax($taxable);
        $pensionEe = EthiopianPayrollTax::employeePension($basic);
        $pensionEr = EthiopianPayrollTax::employerPension($basic);

        $totalDeductions = round($incomeTax + $pensionEe + $otherDeduct, 2);

        return [
            'no'                    => 0,
            'id'                    => $employee->id,
            'employee_id'           => $employee->id,
            'employee_name'         => trim($employee->first_name . ' ' . $employee->last_name),
            'employee_number'       => $employee->employee_number,
            'position'              => $employee->position?->title ?? '—',
            'hire_date'             => $hireDate?->toDateString(),
            'period_start'          => $firstPaid->toDateString(),
            'period_end'            => $end->toDateString(),
            'payment_date'          => $end->toDateString(),
            'days_paid'             => $daysPaid,
            'days_in_period'        => $daysInPeriod,
            'basic_salary'          => $basic,
            'allowances'            => round($allowances, 2),
            'transport_allowance'   => round($transport, 2),
            'non_taxable_allowance' => $nonTaxable,
            'overtime'              => round($overtime, 2),
            'bonus'                 => round($bonus, 2),
            'gross_pay'             => $gross,
            'taxable_income'        => $taxable,
            'income_tax'            => $incomeTax,
            'tax_rate'              => EthiopianPayrollTax::marginalRate($taxable),
            'pension_employee'      => $pensionEe,
            'pension_employer'      => $pensionEr,
            'other_deductions'      => round($otherDeduct, 2),
            'total_deductions'      => $totalDeductions,
            'net_pay'               => round($gross - $totalDeductions, 2),
            'processed_date'        => null,
            'deduction_notes'       => null,
            'components'            => $breakdown,
        ];
    }

    public function getSettings()
    {
        $rates = EthiopianPayrollTax::getRates();
        return response()->json([
            'employee_rate'    => $rates['employee_rate'],
            'employer_rate'    => $rates['employer_rate'],
            'transport_ceiling'=> $rates['transport_ceiling'],
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'employee_rate'     => ['required', 'numeric', 'min:0', 'max:1'],
            'employer_rate'     => ['required', 'numeric', 'min:0', 'max:1'],
            'transport_ceiling' => ['required', 'numeric', 'min:0'],
        ]);

        $settings = [
            'employee_rate'     => (float) $request->input('employee_rate'),
            'employer_rate'     => (float) $request->input('employer_rate'),
            'transport_ceiling' => (float) $request->input('transport_ceiling'),
        ];

        $path = storage_path('app/payroll_settings.json');
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        file_put_contents($path, json_encode($settings, JSON_PRETTY_PRINT));

        return response()->json([
            'message'  => 'Payroll settings updated successfully.',
            'settings' => $settings,
        ]);
    }

    public function updateItem(Request $request, $id)
    {
        $item = PayrollItem::findOrFail($id);

        $request->validate([
            'allowances'          => ['required', 'numeric', 'min:0'],
            'transport_allowance' => ['required', 'numeric', 'min:0'],
            'overtime_pay'        => ['required', 'numeric', 'min:0'],
            'bonuses'             => ['required', 'numeric', 'min:0'],
            'deductions'          => ['nullable', 'numeric', 'min:0'],
            'notes'               => ['nullable', 'string', 'max:500'],
        ]);

        $basic       = (float) $item->base_salary;
        $allowances  = (float) $request->input('allowances');
        $transport   = (float) $request->input('transport_allowance');
        $overtime    = (float) $request->input('overtime_pay');
        $bonus       = (float) $request->input('bonuses');
        $otherDeduct = $request->has('deductions') ? (float) $request->input('deductions') : (float) $item->deductions;
        $notes       = $request->input('notes', $item->notes);

        $gross      = round($basic + $allowances + $transport + $bonus + $overtime, 2);
        $nonTaxable = EthiopianPayrollTax::exemptTransportAllowance($transport, $basic);
        $taxable    = round(max(0, $gross - $nonTaxable), 2);

        $incomeTax = EthiopianPayrollTax::incomeTax($taxable);
        $pensionEe = EthiopianPayrollTax::employeePension($basic);
        $pensionEr = EthiopianPayrollTax::employerPension($basic);

        $totalDeductions = round($incomeTax + $pensionEe + $otherDeduct, 2);
        $netPay = round($gross - $totalDeductions, 2);

        $item->update([
            'allowances'            => $allowances,
            'transport_allowance'   => $transport,
            'overtime_pay'          => $overtime,
            'bonuses'               => $bonus,
            'deductions'            => $otherDeduct,
            'notes'                 => $notes,
            'gross_pay'             => $gross,
            'non_taxable_allowance' => $nonTaxable,
            'taxable_income'        => $taxable,
            'tax'                   => $incomeTax,
            'pension_employee'      => $pensionEe,
            'pension_employer'      => $pensionEr,
            'net_pay'               => $netPay,
        ]);

        // Recalculate totals for the run
        $run = $item->run;
        $allItems = PayrollItem::where('payroll_run_id', $run->id)->get();

        $run->update([
            'total_gross_pay'        => $allItems->sum('gross_pay'),
            'total_deductions'       => $allItems->sum(function($i) {
                return (float) $i->tax + (float) $i->pension_employee + (float) $i->deductions;
            }),
            'total_income_tax'       => $allItems->sum('tax'),
            'total_pension_employee' => $allItems->sum('pension_employee'),
            'total_pension_employer' => $allItems->sum('pension_employer'),
            'total_net_pay'          => $allItems->sum('net_pay'),
        ]);

        // Return the updated sheet
        $period = Carbon::createFromFormat('Y-m-d', $run->period_key . '-01')->startOfDay();
        return response()->json([
            'message' => 'Payroll item updated successfully.',
            'item'    => $item,
            'sheet'   => $this->sheet($period, $this->recordsFromRun($run), $run),
        ]);
    }
}
