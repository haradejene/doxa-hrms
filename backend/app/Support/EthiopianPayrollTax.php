<?php

namespace App\Support;

/**
 * Ethiopian employment income tax and pension arithmetic.
 *
 * Rates live in config/payroll.php so they can be updated without touching
 * this class when a proclamation changes them.
 */
class EthiopianPayrollTax
{
    /**
     * Employment income tax on a monthly taxable income.
     */
    public static function incomeTax(float $taxableIncome): float
    {
        if ($taxableIncome <= 0) {
            return 0.0;
        }

        foreach (self::getRates()['tax_brackets'] as $bracket) {
            $upper = $bracket['to'];

            if ($upper === null || $taxableIncome <= $upper) {
                return round(max(0, $taxableIncome * $bracket['rate'] - $bracket['deduction']), 2);
            }
        }

        return 0.0;
    }

    /**
     * The marginal rate applied to a monthly taxable income, as a percentage.
     */
    public static function marginalRate(float $taxableIncome): float
    {
        foreach (self::getRates()['tax_brackets'] as $bracket) {
            $upper = $bracket['to'];

            if ($upper === null || $taxableIncome <= $upper) {
                return round($bracket['rate'] * 100, 2);
            }
        }

        return 0.0;
    }

    public static function getRates(): array
    {
        $path = storage_path('app/payroll_settings.json');
        $saved = [];
        if (file_exists($path)) {
            $saved = json_decode(file_get_contents($path), true) ?? [];
        }

        return [
            'employee_rate'    => (float) ($saved['employee_rate'] ?? config('payroll.pension.employee_rate')),
            'employer_rate'    => (float) ($saved['employer_rate'] ?? config('payroll.pension.employer_rate')),
            'transport_ceiling'=> (float) ($saved['transport_ceiling'] ?? config('payroll.transport_allowance.ceiling')),
            'tax_brackets'     => $saved['tax_brackets'] ?? config('payroll.tax_brackets'),
        ];
    }

    /** Employee pension contribution (7% of basic salary). */
    public static function employeePension(float $basicSalary): float
    {
        return round(max(0, $basicSalary) * self::getRates()['employee_rate'], 2);
    }

    /** Employer pension contribution (11% of basic salary). */
    public static function employerPension(float $basicSalary): float
    {
        return round(max(0, $basicSalary) * self::getRates()['employer_rate'], 2);
    }

    /**
     * The tax-exempt slice of a transport allowance: the lesser of a quarter
     * of basic salary and the statutory monthly ceiling.
     */
    public static function exemptTransportAllowance(float $transportAllowance, float $basicSalary): float
    {
        if ($transportAllowance <= 0) {
            return 0.0;
        }

        $rates = self::getRates();
        $limit = min(
            $basicSalary * config('payroll.transport_allowance.basic_salary_share'),
            $rates['transport_ceiling']
        );

        return round(min($transportAllowance, max(0, $limit)), 2);
    }
}
