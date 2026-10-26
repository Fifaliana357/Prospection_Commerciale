<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client', function (Blueprint $table) {
            $table->id('id_client');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            
            $table->string('matricule', 100);
            $table->enum('type', ['particulier', 'entreprise', 'autre'])->default('particulier');
            $table->string('nom', 100);
            $table->string('prenom', 100)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('facebook')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('entreprise', 150)->nullable();
            $table->string('poste', 100)->nullable();
            $table->string('classification', 100)->nullable();
            $table->string('profession', 100)->nullable();
            $table->string('site_web')->nullable();
            $table->string('pays', 100)->nullable();
            $table->string('domaine', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client');
    }
};