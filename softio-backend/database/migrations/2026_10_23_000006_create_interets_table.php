<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('interet', function (Blueprint $table) {
            $table->id('id_interet');
            $table->foreignId('id_client')->constrained('client', 'id_client')->onDelete('cascade');
            $table->string('produit_concerne')->nullable();
            $table->integer('niveau')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('interet'); }
};