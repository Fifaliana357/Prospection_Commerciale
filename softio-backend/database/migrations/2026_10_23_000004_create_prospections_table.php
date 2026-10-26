<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // On supprime l'ancienne table si elle existe pour repartir sur de bonnes bases
        Schema::dropIfExists('prospection'); 

        Schema::create('prospection', function (Blueprint $table) {
            $table->id('id_prospection');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            $table->foreignId('id_client')->constrained('client', 'id_client')->onDelete('cascade');
            
            // Nouveaux champs
            $table->unsignedBigInteger('id_offre')->nullable(); 
            $table->string('produit_prospecte')->nullable();
            $table->string('etat')->default('en_cours');
            $table->integer('note_actuelle')->default(0);
            $table->boolean('est_perdu')->default(false);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospection');
    }
};