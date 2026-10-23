<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BibliothequeController;
use App\Http\Controllers\ClosingController;
use App\Http\Controllers\CommercialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\InteretController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\ProspectController;
use App\Http\Controllers\ProspectionController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\SavTicketController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VenteController;
use Illuminate\Support\Facades\Route;

// --- AUTHENTIFICATION ---
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// --- ROUTES REST CRM ---
Route::apiResource('prospects', ProspectController::class);
Route::apiResource('prospections', ProspectionController::class);
Route::apiResource('rendez-vous', RendezVousController::class);
Route::apiResource('ventes', VenteController::class);
Route::apiResource('factures', FactureController::class);
Route::apiResource('catalogue', ProduitController::class);

// Gestion des Stocks
Route::prefix('stock')->group(function () {
    Route::get('/mouvements', [StockController::class, 'getMouvements']);
    Route::get('/inventaire', [StockController::class, 'getInventaire']);
    Route::post('/mouvements', [StockController::class, 'storeMouvement']);
});

Route::apiResource('sav-tickets', SavTicketController::class);
Route::apiResource('commerciaux', CommercialController::class);
Route::apiResource('interets', InteretController::class);
Route::apiResource('closings', ClosingController::class);
Route::apiResource('bibliotheque', BibliothequeController::class)->only(['index', 'store', 'destroy']);

// Dashboard & Statistiques
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
