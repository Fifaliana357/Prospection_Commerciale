<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprise', function (Blueprint $table) {
            $table->id('id_entreprise');
            $table->foreignId('id_admin')->unique()->constrained('admin', 'id_admin')->cascadeOnDelete();
            $table->string('nom_entreprise');
            $table->string('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('nif')->nullable();
            $table->string('stat')->nullable();
            $table->string('rcs')->nullable();
            $table->string('logo')->nullable();
            $table->string('cachet')->nullable();
            $table->string('signature')->nullable();
            $table->timestamps();
        });

        Schema::create('comptabilite_operation', function (Blueprint $table) {
            $table->id('id_operation');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->cascadeOnDelete();
            $table->enum('type', ['depense', 'versement']);
            $table->decimal('montant', 15, 2);
            $table->string('motif');
            $table->dateTime('date_operation');
            $table->string('piece_jointe')->nullable();
            $table->timestamps();
            $table->index(['id_admin', 'type', 'date_operation'], 'compta_admin_type_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comptabilite_operation');
        Schema::dropIfExists('entreprise');
    }
};
