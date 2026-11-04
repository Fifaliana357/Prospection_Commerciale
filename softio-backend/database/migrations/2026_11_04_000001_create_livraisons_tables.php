<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livraison', function (Blueprint $table) {
            $table->id('id_livraison');
            $table->foreignId('id_vente')->unique()->constrained('vente', 'id_vente')->cascadeOnDelete();
            $table->text('adresse')->nullable();
            $table->string('statut', 30)->default('a_preparer')->index();
            $table->date('date_prevue')->nullable()->index();
            $table->dateTime('date_livraison')->nullable();
            $table->string('livreur')->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });

        Schema::create('livraison_historique', function (Blueprint $table) {
            $table->id('id_historique');
            $table->foreignId('id_livraison')->constrained('livraison', 'id_livraison')->cascadeOnDelete();
            $table->string('ancien_statut', 30)->nullable();
            $table->string('nouveau_statut', 30);
            $table->text('commentaire')->nullable();
            $table->foreignId('id_admin')->nullable()->constrained('admin', 'id_admin')->nullOnDelete();
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->nullOnDelete();
            $table->timestamps();
        });

        DB::table('vente')
            ->where('statut', 'validee')
            ->orderBy('id_vente')
            ->chunkById(200, function ($sales) {
                foreach ($sales as $sale) {
                    $now = now();
                    $deliveryId = DB::table('livraison')->insertGetId([
                        'id_vente' => $sale->id_vente,
                        'statut' => 'a_preparer',
                        'livreur' => $sale->id_commercial
                            ? DB::table('commercial')->where('id_commercial', $sale->id_commercial)->value(DB::raw("CONCAT_WS(' ', prenom, nom)"))
                            : null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], 'id_livraison');

                    DB::table('livraison_historique')->insert([
                        'id_livraison' => $deliveryId,
                        'ancien_statut' => null,
                        'nouveau_statut' => 'a_preparer',
                        'commentaire' => 'Livraison initialisée à partir d’une vente déjà validée.',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }, 'id_vente');
    }

    public function down(): void
    {
        Schema::dropIfExists('livraison_historique');
        Schema::dropIfExists('livraison');
    }
};
