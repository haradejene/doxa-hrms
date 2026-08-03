<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Gregorian <-> Ethiopian (Amete Mihret) calendar conversion.
 *
 * The Ethiopian year has 12 months of 30 days plus a 13th month (Pagume) of
 * 5 days, or 6 in a leap year. Conversion goes through the Julian Day Number
 * so leap years take care of themselves.
 *
 * Month names are the standard transliterated Amharic ones used on the
 * Employment Income Tax Declaration form.
 */
class EthiopianCalendar
{
    /** JDN of Meskerem 1, 1 E.C. */
    private const EPOCH = 1723856;

    /** Ethiopian month names, indexed 1-13. */
    public const MONTHS = [
        1 => 'Meskerem',
        2 => 'Tikimt',
        3 => 'Hidar',
        4 => 'Tahsas',
        5 => 'Tir',
        6 => 'Yekatit',
        7 => 'Megabit',
        8 => 'Miyazya',
        9 => 'Ginbot',
        10 => 'Sene',
        11 => 'Hamle',
        12 => 'Nehase',
        13 => 'Pagume',
    ];

    /**
     * Convert a Gregorian date to Ethiopian [year, month, day].
     *
     * @return array{0:int,1:int,2:int}
     */
    public static function fromGregorian(CarbonInterface $date): array
    {
        $jdn = self::gregorianToJdn($date->year, $date->month, $date->day);

        $offset = $jdn - self::EPOCH;
        $cycle  = intdiv($offset, 1461);
        $r      = $offset % 1461;
        $n      = ($r % 365) + 365 * intdiv($r, 1460);

        $year  = 4 * $cycle + intdiv($r, 365) - intdiv($r, 1460);
        $month = intdiv($n, 30) + 1;
        $day   = ($n % 30) + 1;

        return [$year, $month, $day];
    }

    /**
     * Describe a Gregorian date the way the tax declaration header does,
     * e.g. "Caamsa 30 / 2013 E.C".
     *
     * @return array{year:int,month:int,day:int,month_name:string,label:string}
     */
    public static function describe(CarbonInterface $date): array
    {
        [$year, $month, $day] = self::fromGregorian($date);

        return [
            'year'       => $year,
            'month'      => $month,
            'day'        => $day,
            'month_name' => self::MONTHS[$month],
            'label'      => sprintf('%s %d / %d E.C', self::MONTHS[$month], $day, $year),
        ];
    }

    /** Julian Day Number for a Gregorian calendar date. */
    private static function gregorianToJdn(int $year, int $month, int $day): int
    {
        $a = intdiv(14 - $month, 12);
        $y = $year + 4800 - $a;
        $m = $month + 12 * $a - 3;

        return $day
            + intdiv(153 * $m + 2, 5)
            + 365 * $y
            + intdiv($y, 4)
            - intdiv($y, 100)
            + intdiv($y, 400)
            - 32045;
    }
}
