<?php

namespace App\Http\Controllers;

use App\Auth\DoxaLinkAudit;
use App\Auth\DoxaLinkClient;
use App\Auth\DoxaLinkFailure;
use App\Auth\DoxaLinkHost;
use App\Models\DoxaLinkTransaction;
use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Authorization\AuthorizationOptions;
use Doxa\Laravel\Credentials\ManagedLoginPolicy;
use Doxa\Laravel\Exceptions\DoxaException;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class DoxaLinkController extends Controller
{
    public function __construct(private DoxaLinkClient $oidc, private DoxaLinkHost $host, private DoxaLinkAudit $audit) {}

    private function admin(): User
    {
        return $this->host->admin();
    }

    private function binding(Request $request): string
    {
        return $this->host->binding($request);
    }

    private function transaction(Request $request, string $id, string $status): DoxaLinkTransaction
    {
        $row = $this->host->transaction($request, $id);
        if ($row->status !== $status) {
            throw new DoxaLinkFailure('transaction_replay');
        }

        return $row;
    }

    private function target(DoxaLinkTransaction $row): User
    {
        return $this->host->target($row);
    }

    private function eligible(DoxaLinkTransaction $row, User $user): ?ExternalIdentity
    {
        return $this->host->eligible($row);
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
        try {
            if (! $transaction && is_string($request->route('id'))) {
                $candidate = DoxaLinkTransaction::find($request->route('id'));
                if ($candidate && $candidate->admin_id === Auth::guard('web')->id()
                    && hash_equals($candidate->session_binding, $this->binding($request))) {
                    $transaction = $candidate;
                }
            }
        } catch (\Throwable) {
        }
        $category = $exception instanceof DoxaLinkFailure ? $exception->category : 'link_unavailable';
        if ($exception instanceof DoxaException) {
            $category = 'oidc_validation_failed';
        }
        if ($exception instanceof QueryException && in_array((string) $exception->getCode(), ['23000', '23505'], true)) {
            $category = 'identity_conflict';
        }
        try {
            $this->audit->write('failed', $transaction, Auth::guard('web')->user(), $category);
        } catch (\Throwable) {
        }

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
                    'client_id' => config('doxa.client_id'), 'session_binding' => $this->binding($request), 'expires_at' => now()->addMinutes(5), 'status' => 'pending',
                ]);
                $user = $this->target($transaction);
                if ($user->externalIdentities()->where('issuer', config('doxa.issuer'))->exists()) {
                    throw new DoxaLinkFailure('target_already_linked');
                }
                $transaction->save();
                $this->audit->write('initiated', $transaction, $admin);

                return $transaction;
            });
            $redirect = $this->oidc->client()->beginManagedLogin(ManagedLoginPolicy::pendingLink($transaction->id), AuthorizationOptions::reauthenticate());
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
            $result = $this->oidc->client()->handleManagedCallback($request);
            $identity = $result->identity();
            $transaction = $stateHash ? DoxaLinkTransaction::where('oauth_state_hash', $stateHash)->first() : null;
            if (! $transaction) {
                throw new DoxaLinkFailure('transaction_binding');
            }
            DB::transaction(function () use ($request, &$transaction, $identity, $result) {
                $transaction = $this->transaction($request, $transaction->id, 'pending');
                $user = $this->target($transaction);
                $transaction->identity = ['issuer' => $identity->issuer(), 'subject' => $identity->subject(), 'name' => $identity->name(), 'email' => $identity->email()];
                $this->eligible($transaction, $user);
                $transaction->credential_reference = $result->credentialContext()->serverReference();
                $transaction->status = 'verified';
                $transaction->save();
            });

            return new RedirectResponse('/employees/doxa-link/'.$transaction->id);
        } catch (\Throwable $exception) {
            // Find only a matching, owned transaction for safe failure audit.
            try {
                if (! $transaction && isset($stateHash)) {
                    $transaction = DoxaLinkTransaction::where('oauth_state_hash', $stateHash)->first();
                }
            } catch (\Throwable) {
            }
            $failure = $this->fail($request, $transaction, $exception);

            return $request->expectsJson() ? $failure : new RedirectResponse('/employees/doxa-link/error');
        }
    }

    private function success(DoxaLinkTransaction $row)
    {
        $link = $this->host->eligible($row);
        if (! $link || $link->id !== $row->mapping_id || $link->pending_link_id !== null
            || ! str_contains($row->credential_reference ?? '', '.')) {
            throw new DoxaLinkFailure('commit_unverified');
        }

        return response()->json(['status' => 'completed', 'destination' => '/employees/'.$row->employee_id.'?doxa_link=success']);
    }

    public function show(Request $request, string $id)
    {
        try {
            $row = $this->host->transaction($request, $id);
            $this->host->eligible($row);
            if ($row->status === 'completed') {
                return $this->success($row);
            }
            if (in_array($row->status, ['claimed', 'committed'], true)) {
                return response()->json(['status' => 'processing'], 202);
            }
            if ($row->status !== 'verified') {
                throw new DoxaLinkFailure('authorization_required');
            }

            return response()->json(['status' => 'verified', 'employee_name' => Employee::findOrFail($row->employee_id)->full_name, 'identity' => $row->identity]);
        } catch (\Throwable $exception) {
            return $this->fail($request, null, $exception);
        }
    }

    public function confirm(Request $request, string $id)
    {
        try {
            $this->cleanInput($request);
            $row = $this->host->transaction($request, $id);
            $this->host->eligible($row);
            if ($row->status === 'completed') {
                return $this->success($row);
            }
            if (in_array($row->status, ['claimed', 'committed'], true)) {
                return response()->json(['status' => 'processing'], 202);
            }
            if ($row->status !== 'verified' || ! $row->credential_reference) {
                throw new DoxaLinkFailure('authorization_required');
            }
            DoxaLinkTransaction::whereKey($id)->where('status', 'verified')->update(['confirmed_at' => now()]);
            $client = $this->oidc->client();
            $pending = $client->restoreCredentialContext($row->credential_reference);
            // SDK claims the attempt, checks fresh access, and calls our transactional host adapter.
            $completed = $client->completePendingLink($pending);
            DB::transaction(function () use ($request, $id, $completed) {
                DoxaLinkTransaction::whereKey($id)->lockForUpdate()->firstOrFail();
                $row = $this->host->transaction($request, $id);
                $link = $this->host->eligible($row);
                if ($row->status !== 'committed' || ! $link || $link->id !== $row->mapping_id) {
                    throw new DoxaLinkFailure('commit_unverified');
                }
                // Receipt and mapping release share a single host commit.
                $row->credential_reference = $completed->serverReference();
                $row->status = 'completed';
                $row->consumed_at = now();
                $row->reconcile_after = null;
                $row->save();
                ExternalIdentity::whereKey($link->id)->where('pending_link_id', $row->id)->update(['pending_link_id' => null]);
                $this->audit->write('succeeded', $row, $this->host->admin());
            });

            return $this->success($this->host->transaction($request, $id));
        } catch (\Throwable $exception) {
            // A lost host acknowledgement is reconciled read-only; never delete a valid receipt.
            try {
                $receipt = $this->host->transaction($request, $id);
                if ($receipt->status === 'completed') {
                    $this->host->eligible($receipt);

                    return $this->success($receipt);
                }
            } catch (\Throwable) {
            }

            return $this->fail($request, null, $exception);
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
                if (DoxaLinkTransaction::whereKey($id)->where('status', $status)->update(['status' => 'cancelled', 'consumed_at' => now(), 'reconcile_after' => now()]) !== 1) {
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
