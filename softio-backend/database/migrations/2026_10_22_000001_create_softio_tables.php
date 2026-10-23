<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Prospects
        Schema::create('prospects', function (Blueprint $table) {
            $table->id();
            $table->string('matricule', 50)->unique();
            $table->string('nom', 100)->nullable();
            $table->string('prenom', 100)->nullable();
            $table->enum('type', ['particulier', 'entreprise'])->default('particulier');
            $table->string('email', 150)->nullable();
            $table->string('contact', 50)->nullable();
            $table->string('entreprise', 150)->nullable();
            $table->string('classification', 50)->default('Nouveau');
            $table->string('pays', 100)->default('Madagascar');
            $table->string('domaine', 100)->nullable();
            $table->timestamps();
        });

        // 2. Prospections
        Schema::create('prospections', function (Blueprint $table) {
            $table->id();
            $table->string('date', 50);
            $table->string('objet', 191);
            $table->string('contact', 50)->nullable();
            $table->string('nom', 100)->nullable();
            $table->string('entreprise', 150)->nullable();
            $table->string('fonction', 100)->nullable();
            $table->string('etat', 50)->default('Non clôturé');
            $table->string('editeur', 100)->default('Admin');
            $table->integer('score')->nullable();
            $table->timestamps();
        });

        // 3. Rendez-vous
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->string('date', 50);
            $table->string('heure', 20);
            $table->string('prospect', 150);
            $table->string('contact', 50)->nullable();
            $table->string('mode', 50)->default('Visio');
            $table->string('lieu', 191)->nullable();
            $table->text('commentaire')->nullable();
            $table->string('statut', 50)->default('En attente');
            $table->timestamps();
        });

        // 4. Ventes
        Schema::create('ventes', function (Blueprint $table) {
            $table->id();
            $table->string('num', 50)->unique();
            $table->string('type', 50)->default('Produit');
            $table->string('montant', 50);
            $table->string('date', 50);
            $table->string('totalHT', 50);
            $table->string('tva', 50)->default('0');
            $table->string('statut', 50)->default('Brouillon');
            $table->timestamps();
        });

        // 5. Factures / Devis
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('num', 50)->unique();
            $table->string('type', 50)->default('Facture');
            $table->string('montant', 50);
            $table->string('date', 50);
            $table->string('totalHT', 50);
            $table->string('tva', 50)->default('0');
            $table->string('statut', 50)->default('Brouillon');
            $table->timestamps();
        });

        // 6. Catalogue (Produits & Services)
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 50)->unique();
            $table->string('designation', 191);
            $table->string('type', 50)->default('Produit');
            $table->string('prix', 50);
            $table->integer('stock')->nullable();
            $table->timestamps();
        });

        // 7. Stock - Mouvements
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 50);
            $table->string('designation', 191);
            $table->integer('quantite');
            $table->string('date', 50);
            $table->enum('type', ['Entrée', 'Sortie'])->default('Entrée');
            $table->timestamps();
        });

        // 8. SAV Tickets
        Schema::create('sav_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('num', 50)->unique();
            $table->string('client', 150);
            $table->string('sujet', 191);
            $table->string('priorite', 30)->default('Moyenne');
            $table->string('statut', 30)->default('Ouvert');
            $table->string('date', 50);
            $table->timestamps();
        });

        // 9. Commerciaux
        Schema::create('commerciaux', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 150)->unique();
            $table->string('contact', 50)->nullable();
            $table->integer('prospects')->default(0);
            $table->integer('ventes')->default(0);
            $table->timestamps();
        });

        // 10. Intérêts
        Schema::create('interets', function (Blueprint $table) {
            $table->id();
            $table->string('prospect', 150);
            $table->string('type', 50)->default('particulier');
            $table->string('produit', 191);
            $table->string('typeOffre', 50)->default('Produit');
            $table->string('date', 50);
            $table->string('niveau', 50)->default('Moyen');
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });

        // 11. Closings
        Schema::create('closings', function (Blueprint $table) {
            $table->id();
            $table->string('offre', 191);
            $table->text('description')->nullable();
            $table->string('montant', 50);
            $table->string('client', 150);
            $table->string('email', 150)->nullable();
            $table->string('editeur', 100)->default('Admin');
            $table->timestamps();
        });

        // 12. Bibliothèque
        Schema::create('bibliotheque_fichiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 191);
            $table->string('type', 50);
            $table->string('taille', 50)->default('—');
            $table->string('chemin_fichier', 191)->nullable();
            $table->string('date', 50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bibliotheque_fichiers');
        Schema::dropIfExists('closings');
        Schema::dropIfExists('interets');
        Schema::dropIfExists('commerciaux');
        Schema::dropIfExists('sav_tickets');
        Schema::dropIfExists('mouvements_stock');
        Schema::dropIfExists('produits');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('ventes');
        Schema::dropIfExists('rendez_vous');
        Schema::dropIfExists('prospections');
        Schema::dropIfExists('prospects');
    }
};
