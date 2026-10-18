<?php

namespace Tests\Fixtures;

use Illuminate\Database\SQLiteConnection;

/** Throw once AFTER a real autocommitted activation. Shared across SDK connection cloning. */
class DoxaCredentialAckConnection extends SQLiteConnection
{
    public object $fault;

    public function affectingStatement($query, $bindings = [])
    {
        $result = parent::affectingStatement($query, $bindings);
        if ($result === 1 && in_array('active', $bindings, true) && ! $this->fault->thrown) {
            $this->fault->thrown = true;
            throw new \RuntimeException('Synthetic promotion acknowledgement loss');
        }

        return $result;
    }
}
