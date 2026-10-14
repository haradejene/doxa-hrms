<?php

namespace App\Auth;

final class DoxaLinkFailure extends \RuntimeException
{
    public function __construct(public readonly string $category)
    {
        parent::__construct($category);
    }
}
