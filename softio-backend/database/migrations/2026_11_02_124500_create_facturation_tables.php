<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('devis')) {
            Schema::create('devis', function (Blueprint $table) {
                $table->id('id_devis');
                $table->foreignId('id_admin')->constrained('admin', 'id_admin')->cascadeOnDelete();
                $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->nullOnDelete();
                $table->foreignId('id_client')->constrained('client', 'id_client')->cascadeOnDelete();
                $table->string('numero', 40);
                $table->string('type', 30);
                $table->date('date_devis');
                $table->string('intitule')->nullable();
                $table->unsignedBigInteger('montant_ht')->default(0);
                $table->unsignedBigInteger('montant_ttc')->default(0);
                $table->unsignedBigInteger('remise_globale')->default(0);
                $table->boolean('inclure_tva')->default(false);
                $table->decimal('taux_tva', 5, 2)->default(20);
                $table->string('statut', 30)->default('brouillon');
                $table->string('methode_paiement')->nullable();
                $table->text('modalites')->nullable();
                $table->text('remarque')->nullable();
                $table->timestamps();

                $table->unique(['id_admin', 'numero']);
                $table->index(['id_admin', 'statut', 'type']);
            });
        }

        if (! Schema::hasTable('ligne_devis')) {
            Schema::create('ligne_devis', function (Blueprint $table) {
                $table->id('id_ligne_devis');
                $table->foreignId('id_devis')->constrained('devis', 'id_devis')->cascadeOnDelete();
                $table->unsignedBigInteger('id_produit')->nullable();
                $table->unsignedBigInteger('id_offre')->nullable();
                $table->string('type_ligne', 20)->default('produit');
                $table->string('designation');
                $table->text('description')->nullable();
                $table->decimal('quantite', 12, 2)->default(1);
                $table->unsignedBigInteger('prix_unitaire')->default(0);
                $table->unsignedBigInteger('remise')->default(0);
                $table->unsignedBigInteger('montant')->default(0);
                $table->unsignedInteger('ordre')->default(0);

                $table->foreign('id_produit')->references('id_produit')->on('produit')->nullOnDelete();
                $table->index('id_offre');
            });
        }

        if (! Schema::hasTable('ligne_vente')) {
            Schema::create('ligne_vente', function (Blueprint $table) {
                $table->id('id_ligne_vente');
                $table->foreignId('id_vente')->constrained('vente', 'id_vente')->cascadeOnDelete();
                $table->unsignedBigInteger('id_produit')->nullable();
                $table->unsignedBigInteger('id_offre')->nullable();
                $table->string('type_ligne', 20)->default('produit');
                $table->string('designation');
                $table->text('description')->nullable();
                $table->decimal('quantite', 12, 2)->default(1);
                $table->unsignedBigInteger('prix_unitaire')->default(0);
                $table->unsignedBigInteger('remise')->default(0);
                $table->unsignedBigInteger('montant')->default(0);
                $table->unsignedInteger('ordre')->default(0);

                $table->foreign('id_produit')->references('id_produit')->on('produit')->nullOnDelete();
                $table->index('id_offre');
            });
        }

        if (Schema::hasTable('vente')) {
            Schema::table('vente', function (Blueprint $table) {
                if (! Schema::hasColumn('vente', 'id_devis')) {
                    $table->unsignedBigInteger('id_devis')->nullable()->unique();
                }
                if (! Schema::hasColumn('vente', 'numero')) {
                    $table->string('numero', 40)->nullable();
                }
                if (! Schema::hasColumn('vente', 'type_document')) {
                    $table->string('type_document', 30)->default('facture');
                }
                if (! Schema::hasColumn('vente', 'date_vente')) {
                    $table->dateTime('date_vente')->nullable();
                }
                if (! Schema::hasColumn('vente', 'intitule')) {
                    $table->string('intitule')->nullable();
                }
                if (! Schema::hasColumn('vente', 'montant_ht')) {
                    $table->unsignedBigInteger('montant_ht')->default(0);
                }
                if (! Schema::hasColumn('vente', 'montant_ttc')) {
                    $table->unsignedBigInteger('montant_ttc')->default(0);
                }
                if (! Schema::hasColumn('vente', 'inclure_tva')) {
                    $table->boolean('inclure_tva')->default(false);
                }
                if (! Schema::hasColumn('vente', 'taux_tva')) {
                    $table->decimal('taux_tva', 5, 2)->default(20);
                }
                if (! Schema::hasColumn('vente', 'methode_paiement')) {
                    $table->string('methode_paiement')->nullable();
                }
                if (! Schema::hasColumn('vente', 'modalites')) {
                    $table->text('modalites')->nullable();
                }
            });

            if (Schema::hasColumn('vente', 'id_devis')) {
                Schema::table('vente', function (Blueprint $table) {
                    $table->foreign('id_devis')->references('id_devis')->on('devis')->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['devis', 'ligne_devis', 'ligne_vente'] as $tableName) {
            if (Schema::hasTable($tableName) && DB::table($tableName)->exists()) {
                throw new RuntimeException(
                    'Facturation data exists; archive it before rolling back the billing migration.'
                );
            }
        }

        if (Schema::hasTable('vente') && Schema::hasColumn('vente', 'id_devis')) {
            Schema::table('vente', function (Blueprint $table) {
                $table->dropForeign(['id_devis']);
                $table->dropUnique(['id_devis']);
                $columns = [
                    'id_devis',
                    'numero',
                    'type_document',
                    'date_vente',
                    'intitule',
                    'montant_ht',
                    'montant_ttc',
                    'inclure_tva',
                    'taux_tva',
                    'methode_paiement',
                    'modalites',
                ];
                $table->dropColumn(array_values(array_filter(
                    $columns,
                    fn (string $column) => Schema::hasColumn('vente', $column)
                )));
            });
        }

        Schema::dropIfExists('ligne_vente');
        Schema::dropIfExists('ligne_devis');
        Schema::dropIfExists('devis');
    }
};
