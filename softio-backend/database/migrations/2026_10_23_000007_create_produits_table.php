<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produit', function (Blueprint $table) {
            $table->id('id_produit');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->string('reference')->nullable();
            $table->string('designation');
            $table->text('description')->nullable();
            $table->integer('prix_unitaire')->default(0); // Integer selon ton cast
            $table->string('mots_cles')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produit');
    }
};