<?php

use App\Http\Controllers\DoxaLoginController;
use Doxa\Laravel\Http\SecureCallbackResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth/doxa', [DoxaLoginController::class, 'login'])
    ->middleware(SecureCallbackResponse::class)->name('auth.doxa');
Route::get('/auth/doxa/callback', [DoxaLoginController::class, 'callback'])
    ->middleware(SecureCallbackResponse::class)->name('auth.doxa.callback');

// Browser-session only; web middleware protects every POST with CSRF.
Route::middleware([SecureCallbackResponse::class, 'throttle:30,1'])->group(function () {
    Route::post('/auth/doxa/employees/{employee}/link', [\App\Http\Controllers\DoxaLinkController::class, 'initiate']);
    Route::get('/auth/doxa/link/callback', [\App\Http\Controllers\DoxaLinkController::class, 'callback']);
    Route::get('/auth/doxa/link/{id}', [\App\Http\Controllers\DoxaLinkController::class, 'show']);
    Route::post('/auth/doxa/link/{id}/confirm', [\App\Http\Controllers\DoxaLinkController::class, 'confirm']);
    Route::post('/auth/doxa/link/{id}/cancel', [\App\Http\Controllers\DoxaLinkController::class, 'cancel']);
});
