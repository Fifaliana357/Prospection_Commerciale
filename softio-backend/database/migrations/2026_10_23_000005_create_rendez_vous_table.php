<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id('id_rendez_vous'); // Clé primaire
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            $table->foreignId('id_client')->constrained('client', 'id_client')->onDelete('cascade');

            // Les champs de ton modèle
            $table->datetime('date_rdv');
            $table->string('lieu')->nullable();
            $table->string('type_rdv')->nullable();
            $table->string('statut')->default('prevu');
            $table->string('numero_rdv')->nullable();
            $table->string('lien_rdv')->nullable();
            $table->text('commentaire')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};
