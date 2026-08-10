<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Employer details
    |--------------------------------------------------------------------------
    |
    | Printed in the header of the Employment Income Tax Declaration sheet.
    | Every field is env-overridable so the filed declaration can be corrected
    | without a code change.
    |
    */

    'employer' => [
        'name'         => env('PAYROLL_EMPLOYER_NAME', 'Doxa Innovations'),
        'program'      => env('PAYROLL_EMPLOYER_PROGRAM', ''),
        'tin'          => env('PAYROLL_EMPLOYER_TIN', ''),
        'region'       => env('PAYROLL_EMPLOYER_REGION', 'Oromiya'),
        'zone'         => env('PAYROLL_EMPLOYER_ZONE', 'E.sha'),
        'wereda'       => env('PAYROLL_EMPLOYER_WEREDA', 'Bishooftuu'),
        'kebele'       => env('PAYROLL_EMPLOYER_KEBELE', '02'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Basis of employees.base_salary
    |--------------------------------------------------------------------------
    |
    | "monthly" treats the stored figure as the monthly basic salary; "annual"
    | divides it by twelve first. This matters: Ethiopian employment income tax
    | is progressive and assessed monthly, so the basis changes the tax due.
    |
    */

    'base_salary_basis' => env('PAYROLL_SALARY_BASIS', 'monthly'),

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    */

    'currency' => [
        'code'   => 'ETB',
        'symbol' => 'Br',
    ],

    /*
    |--------------------------------------------------------------------------
    | Employment income tax brackets
    |--------------------------------------------------------------------------
    |
    | Monthly brackets from the Federal Income Tax Proclamation No. 979/2016.
    | Each band carries a flat deduction so the tax on an amount inside the
    | band is simply (amount * rate) - deduction.
    |
    */

    'tax_brackets' => [
        ['from' => 0.00,     'to' => 2000.00,  'rate' => 0.00, 'deduction' => 0.00],
        ['from' => 2000.01,  'to' => 4000.00,  'rate' => 0.15, 'deduction' => 300.00],
        ['from' => 4000.01,  'to' => 7000.00,  'rate' => 0.20, 'deduction' => 500.00],
        ['from' => 7000.01,  'to' => 10000.00, 'rate' => 0.25, 'deduction' => 850.00],
        ['from' => 10000.01, 'to' => 14000.00, 'rate' => 0.30, 'deduction' => 1350.00],
        ['from' => 14000.01, 'to' => null,     'rate' => 0.35, 'deduction' => 2050.00],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pension contribution
    |--------------------------------------------------------------------------
    |
    | Private Organisation Employees' Pension Proclamation No. 715/2011:
    | 7% from the employee, 11% from the employer, both on basic salary.
    |
    */

    'pension' => [
        'employee_rate' => 0.07,
        'employer_rate' => 0.11,
    ],

    /*
    |--------------------------------------------------------------------------
    | Transport allowance exemption
    |--------------------------------------------------------------------------
    |
    | Transport allowance is exempt from employment income tax up to the lesser
    | of a quarter of the basic salary or the monthly ceiling below.
    |
    */

    'transport_allowance' => [
        'ceiling'            => 2200.00,
        'basic_salary_share' => 0.25,
    ],

];
