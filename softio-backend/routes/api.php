<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BibliothequeController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClosingController;
use App\Http\Controllers\CommercialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\InteretController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\ProspectionController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\SavTicketController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VenteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- AUTHENTIFICATION (Accessible sans être connecté) ---
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1')
    ->name('api.login');

// --- ROUTES PROTÉGÉES (Nécessite d'être connecté avec un Token) ---
Route::middleware('auth:sanctum')->group(function () {

    // 1. Authentification
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // 2. Gestion des Utilisateurs (CRM)
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('commerciaux', CommercialController::class);
    Route::apiResource('prospections', ProspectionController::class);
    Route::post('prospections/{id}/messages', [ProspectionController::class, 'addMessage']);

    // 3. Catalogue & Stock
    Route::apiResource('produits', ProduitController::class);

    Route::prefix('stock')->group(function () {
        Route::get('/mouvements', [StockController::class, 'index']);
        Route::post('/mouvements', [StockController::class, 'store']);
    });

    // 4. Dashboard & Statistiques
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // =====================================================================
    // ⚠️ ROUTES SUIVANTES : À DÉCOMMENTER AU FUR ET À MESURE
    // (Ne les décommente que si tu as bien créé le contrôleur correspondant)
    // =====================================================================

    Route::apiResource('rendez-vous', RendezVousController::class);
    Route::apiResource('ventes', VenteController::class);
    // Route::apiResource('factures', FactureController::class);
    Route::get('/interets', [InteretController::class, 'index']);
    Route::post('/interets', [InteretController::class, 'store']);
    Route::delete('/interets/{id}', [InteretController::class, 'destroy']);
    // Route::apiResource('closings', ClosingController::class);
    // Route::apiResource('sav-tickets', SavTicketController::class);
    // Route::apiResource('bibliotheque', BibliothequeController::class)->only(['index', 'store', 'destroy']);

});
