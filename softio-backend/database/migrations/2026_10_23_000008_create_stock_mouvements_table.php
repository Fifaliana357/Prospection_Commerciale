<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_mouvement', function (Blueprint $table) {
            $table->id('id_mouvement');
            $table->foreignId('id_produit')->constrained('produit', 'id_produit')->onDelete('cascade');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            
            $table->string('type_mouvement'); // ex: 'entree', 'sortie'
            $table->integer('quantite');
            $table->string('reference')->nullable();
            $table->text('commentaire')->nullable();
            $table->dateTime('date_mouvement');
            
            // Pas de $table->timestamps() car $timestamps = false dans ton modèle
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_mouvement');
    }
};