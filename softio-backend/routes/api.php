<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\BibliothequeController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ComptabiliteController;
use App\Http\Controllers\ClosingController;
use App\Http\Controllers\CommercialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\FacturationController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\InteretController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\ProspectionController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\SavTicketController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VenteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorielController;
use App\Http\Controllers\NotificationController;





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
    Route::get('/account/profile', [AccountController::class, 'show']);
    Route::put('/account/profile', [AccountController::class, 'update']);
    Route::put('/account/email', [AccountController::class, 'updateEmail']);
    Route::put('/account/password', [AccountController::class, 'updatePassword']);
    Route::get('/entreprise', [EntrepriseController::class, 'show']);
    Route::post('/entreprise', [EntrepriseController::class, 'update']);
    Route::get('/comptabilite', [ComptabiliteController::class, 'index']);
    Route::get('/comptabilite/export', [ComptabiliteController::class, 'export']);
    Route::post('/comptabilite/operations', [ComptabiliteController::class, 'store']);
    Route::delete('/comptabilite/operations/{id}', [ComptabiliteController::class, 'destroy']);

    // 2. Gestion des Utilisateurs (CRM)
    Route::get('/clients/acheteurs', [ClientController::class, 'buyers']);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('commerciaux', CommercialController::class);
    Route::apiResource('prospections', ProspectionController::class);
    Route::post('prospections/{id}/messages', [ProspectionController::class, 'addMessage']);

    // 3. Catalogue & Stock
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('produits', ProduitController::class);
        Route::apiResource('offres', OffreController::class);
    });

    Route::prefix('stock')->group(function () {
        Route::get('/inventaire', [StockController::class, 'inventory']);
        Route::get('/mouvements', [StockController::class, 'index']);
        Route::post('/mouvements', [StockController::class, 'store']);
        Route::put('/mouvements/{id}', [StockController::class, 'update']);
        Route::delete('/mouvements/{id}', [StockController::class, 'destroy']);
    });

    // 4. Dashboard & Statistiques
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });

    // =====================================================================
    // ⚠️ ROUTES SUIVANTES : À DÉCOMMENTER AU FUR ET À MESURE
    // (Ne les décommente que si tu as bien créé le contrôleur correspondant)
    // =====================================================================

    Route::apiResource('rendez-vous', RendezVousController::class);
    Route::get('/ventes/catalogue', [VenteController::class, 'catalog']);
    Route::post('/ventes/{id}/valider', [VenteController::class, 'validateDocument']);
    Route::post('/ventes/{id}/facture', [VenteController::class, 'createInvoice']);
    Route::apiResource('ventes', VenteController::class);
    Route::get('/facturation/catalogue', [FacturationController::class, 'catalog']);
    Route::get('/facturation', [FacturationController::class, 'index']);
    Route::post('/facturation', [FacturationController::class, 'store']);
    Route::get('/facturation/{id}', [FacturationController::class, 'show']);
    Route::put('/facturation/{id}', [FacturationController::class, 'update']);
    Route::post('/facturation/{id}/valider', [FacturationController::class, 'validateDocument']);
    Route::post('/facturation/{id}/envoyer', [FacturationController::class, 'sendEmail']);
    Route::delete('/facturation/{id}', [FacturationController::class, 'destroy']);
    // Route::apiResource('factures', FactureController::class);
    Route::get('/interets', [InteretController::class, 'index']);
    Route::post('/interets', [InteretController::class, 'store']);
    Route::delete('/interets/{id}', [InteretController::class, 'destroy']);
    Route::get('/closings', [ClosingController::class, 'index']);
    Route::post('/closings', [ClosingController::class, 'store']);
    Route::delete('/closings/{id}', [ClosingController::class, 'destroy']);
    // Route::apiResource('sav-tickets', SavTicketController::class);
    // Route::apiResource('bibliotheque', BibliothequeController::class)->only(['index', 'store', 'destroy']);

    Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('commerciaux', CommercialController::class);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/bibliotheque', [BibliothequeController::class, 'index']);
    Route::post('/bibliotheque', [BibliothequeController::class, 'store']);
    Route::get('/bibliotheque/{id}/download', [BibliothequeController::class, 'download']);
    Route::delete('/bibliotheque/{id}', [BibliothequeController::class, 'destroy']);

    Route::apiResource('tutoriels', TutorielController::class);

    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});
});
});

});
