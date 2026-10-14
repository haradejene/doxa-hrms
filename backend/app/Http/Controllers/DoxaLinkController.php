<?php

namespace App\Http\Controllers;

use App\Auth\DoxaApplicationAccess;
use App\Auth\DoxaLinkAudit;
use App\Auth\DoxaLinkClient;
use App\Auth\DoxaLinkFailure;
use App\Models\DoxaLinkTransaction;
use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Authorization\AuthorizationOptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class DoxaLinkController extends Controller
{
    public function __construct(private DoxaLinkClient $oidc, private DoxaApplicationAccess $access, private DoxaLinkAudit $audit) {}

    private function admin(): User
    {
        $admin = Auth::guard('web')->user();
        if (! $admin || ! $admin->isHrAdmin() || ! $admin->is_active || $admin->deleted_at !== null) {
            throw new DoxaLinkFailure('admin_unauthorized');
        }
        return $admin;
    }

    private function binding(Request $request): string
    {
        return hash('sha256', $request->session()->getId());
    }

    private function transaction(Request $request, string $id, string $status): DoxaLinkTransaction
    {
        $admin = $this->admin();
        $transaction = DoxaLinkTransaction::query()->lockForUpdate()->find($id);
        if (! $transaction || $transaction->admin_id !== $admin->id
            || ! hash_equals($transaction->session_binding, $this->binding($request))) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        if ($transaction->expires_at->isPast()) {
            throw new DoxaLinkFailure('transaction_expired');
        }
        if ($transaction->status !== $status || $transaction->consumed_at !== null) {
            throw new DoxaLinkFailure('transaction_replay');
        }
        return $transaction;
    }

    private function target(DoxaLinkTransaction $transaction): User
    {
        $employee = Employee::query()->lockForUpdate()->find($transaction->employee_id);
        $user = User::query()->lockForUpdate()->find($transaction->target_user_id);
        if (! $employee || ! $user || $employee->user_id !== $user->id || $user->deleted_at !== null) {
            throw new DoxaLinkFailure('target_invalid');
        }
        if (! $user->is_active) {
            throw new DoxaLinkFailure('target_inactive');
        }
        return $user;
    }

    private function eligible(DoxaLinkTransaction $transaction, User $user): ?ExternalIdentity
    {
        $identity = $transaction->identity;
        $issuer = $identity['issuer'] ?? null;
        $subject = $identity['subject'] ?? null;
        if (! is_string($issuer) || $issuer === '' || $issuer !== config('doxa.issuer') || strlen($issuer) > 255
            || ! is_string($subject) || $subject === '' || strlen($subject) > 255) {
            throw new DoxaLinkFailure('identity_invalid');
        }
        if (! $this->access->allowed($issuer, $subject)) {
            throw new DoxaLinkFailure('application_access_denied');
        }
        if ($transaction->expires_at->isPast()) {
            throw new DoxaLinkFailure('transaction_expired');
        }
        $link = ExternalIdentity::query()->where('issuer', $issuer)->where('subject', $subject)->lockForUpdate()->first();
        if ($link && (! hash_equals($issuer, $link->issuer) || ! hash_equals($subject, $link->subject) || $link->user_id !== $user->id)) {
            throw new DoxaLinkFailure('identity_conflict');
        }
        if ($user->externalIdentities()->where('issuer', $issuer)->when($link, fn ($query) => $query->where('id', '!=', $link->id))->exists()) {
            throw new DoxaLinkFailure('target_already_linked');
        }
        return $link;
    }

    private function cleanInput(Request $request): void
    {
        // Mutations accept CSRF only. Reject even seemingly harmless identity,
        // target or destination fields, rather than accidentally using them later.
        if (array_diff(array_keys($request->all()), ['_token']) !== []) {
            throw new DoxaLinkFailure('unexpected_input');
        }
    }

    private function fail(Request $request, ?DoxaLinkTransaction $transaction, \Throwable $exception)
    {
        if (! $transaction && is_string($request->route('id'))) {
            $candidate = DoxaLinkTransaction::find($request->route('id'));
            if ($candidate && $candidate->admin_id === Auth::guard('web')->id()
                && hash_equals($candidate->session_binding, $this->binding($request))) $transaction = $candidate;
        }
        $category = $exception instanceof DoxaLinkFailure ? $exception->category : 'link_unavailable';
        if ($exception instanceof \Doxa\Laravel\Exceptions\DoxaException) $category = 'oidc_validation_failed';
        if ($exception instanceof \Illuminate\Database\QueryException && (string) $exception->getCode() === '23000') $category = 'identity_conflict';
        // A mismatched browser cannot consume another browser's transaction.
        $owned = $transaction && $transaction->admin_id === Auth::guard('web')->id()
            && hash_equals($transaction->session_binding, $this->binding($request));
        DB::transaction(function () use ($transaction, $owned, $category) {
            if ($owned) {
                DoxaLinkTransaction::whereKey($transaction->id)->whereIn('status', ['pending', 'verified'])
                    ->update(['status' => 'failed', 'consumed_at' => now()]);
            }
            $this->audit->write('failed', $transaction, Auth::guard('web')->user(), $category);
        }, 3);
        return response()->json(['error' => $category], $category === 'admin_unauthorized' ? 403 : 409);
    }

    public function initiate(Request $request, string $employee)
    {
        $transaction = null;
        try {
            $admin = $this->admin();
            $this->cleanInput($request);
            $transaction = DB::transaction(function () use ($request, $employee, $admin, &$transaction) {
                $record = Employee::query()->lockForUpdate()->find($employee);
                if (! $record || ! $record->user_id) {
                    throw new DoxaLinkFailure('target_invalid');
                }
                $transaction = new DoxaLinkTransaction;
                $transaction->forceFill([
                    'id' => bin2hex(random_bytes(32)), 'employee_id' => $record->id,
                    'target_user_id' => $record->user_id, 'admin_id' => $admin->id,
                    'session_binding' => $this->binding($request), 'expires_at' => now()->addMinutes(5), 'status' => 'pending',
                ]);
                $user = $this->target($transaction);
                if ($user->externalIdentities()->where('issuer', config('doxa.issuer'))->exists()) {
                    throw new DoxaLinkFailure('target_already_linked');
                }
                $transaction->save();
                $this->audit->write('initiated', $transaction, $admin);
                return $transaction;
            });
            $redirect = $this->oidc->client()->beginLogin(AuthorizationOptions::reauthenticate());
            parse_str(parse_url($redirect->getTargetUrl(), PHP_URL_QUERY), $parameters);
            $transaction->oauth_state_hash = hash('sha256', $parameters['state']);
            $transaction->save();
            return $request->expectsJson()
                ? response()->json(['authorization_url' => $redirect->getTargetUrl()]) : $redirect;
        } catch (\Throwable $exception) {
            return $this->fail($request, $transaction, $exception);
        }
    }

    public function callback(#[\SensitiveParameter] Request $request)
    {
        $transaction = null;
        try {
            // Always validate via SDK first. Only its verified identity is retained.
            $state = $request->query('state');
            $stateHash = is_string($state) ? hash('sha256', $state) : null;
            $identity = $this->oidc->client()->handleCallback($request);
            $transaction = $stateHash ? DoxaLinkTransaction::where('oauth_state_hash', $stateHash)->first() : null;
            if (! $transaction) {
                throw new DoxaLinkFailure('transaction_binding');
            }
            DB::transaction(function () use ($request, &$transaction, $identity) {
                $transaction = $this->transaction($request, $transaction->id, 'pending');
                $user = $this->target($transaction);
                $transaction->identity = ['issuer' => $identity->issuer(), 'subject' => $identity->subject(), 'name' => $identity->name(), 'email' => $identity->email()];
                $this->eligible($transaction, $user);
                $transaction->status = 'verified';
                $transaction->save();
            });
            return redirect('/employees/doxa-link/'.$transaction->id);
        } catch (\Throwable $exception) {
            // Find only a matching, owned transaction for safe failure audit.
            if (! $transaction && isset($stateHash)) {
                $transaction = DoxaLinkTransaction::where('oauth_state_hash', $stateHash)->first();
            }
            $failure = $this->fail($request, $transaction, $exception);
            return $request->expectsJson() ? $failure : redirect('/employees/doxa-link/error');
        }
    }

    public function show(Request $request, string $id)
    {
        $transaction = null;
        try {
            return DB::transaction(function () use ($request, $id, &$transaction) {
                $transaction = $this->transaction($request, $id, 'verified');
                $this->target($transaction);
                $employee = Employee::findOrFail($transaction->employee_id);
                return response()->json(['employee_name' => $employee->full_name, 'identity' => $transaction->identity]);
            });
        } catch (\Throwable $exception) {
            return $this->fail($request, $transaction, $exception);
        }
    }

    public function confirm(Request $request, string $id)
    {
        $transaction = null;
        try {
            return DB::transaction(function () use ($request, $id, &$transaction) {
                $transaction = $this->transaction($request, $id, 'verified');
                $this->cleanInput($request);
                // Durable compare-and-set also protects SQLite and competing workers.
                if (DoxaLinkTransaction::whereKey($id)->where('status', 'verified')->update(['status' => 'processing']) !== 1) {
                    throw new DoxaLinkFailure('transaction_replay');
                }
                $admin = User::query()->lockForUpdate()->find($transaction->admin_id);
                if (! $admin || ! $admin->isHrAdmin() || ! $admin->is_active || $admin->deleted_at !== null) {
                    throw new DoxaLinkFailure('admin_unauthorized');
                }
                $user = $this->target($transaction);
                $link = $this->eligible($transaction, $user);
                if (! $link) {
                    $user->externalIdentities()->create([
                        'issuer' => $transaction->identity['issuer'], 'subject' => $transaction->identity['subject'],
                    ]);
                }
                $transaction->status = 'completed';
                $transaction->consumed_at = now();
                $transaction->save();
                $this->audit->write('succeeded', $transaction, $admin);
                return response()->json(['destination' => '/employees/'.$transaction->employee_id.'?doxa_link=success']);
            }, 3);
        } catch (\Throwable $exception) {
            return $this->fail($request, $transaction, $exception);
        }
    }

    public function cancel(Request $request, string $id)
    {
        $transaction = null;
        try {
            $this->cleanInput($request);
            return DB::transaction(function () use ($request, $id, &$transaction) {
                $transaction = DoxaLinkTransaction::find($id);
                $status = $transaction?->status;
                if (! in_array($status, ['pending', 'verified'], true)) {
                    throw new DoxaLinkFailure('transaction_replay');
                }
                $transaction = $this->transaction($request, $id, $status);
                if (DoxaLinkTransaction::whereKey($id)->where('status', $status)->update(['status' => 'cancelled', 'consumed_at' => now()]) !== 1) {
                    throw new DoxaLinkFailure('transaction_replay');
                }
                $this->audit->write('cancelled', $transaction, $this->admin());
                return response()->json(['destination' => '/employees/'.$transaction->employee_id]);
            });
        } catch (\Throwable $exception) {
            return $this->fail($request, $transaction, $exception);
        }
    }
}
