<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('vente', function (Blueprint $table) {
            $table->id('id_vente');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            $table->foreignId('id_client')->constrained('client', 'id_client')->onDelete('cascade');
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->string('statut')->default('payee'); // ex: payee, impayee, annulee
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('vente'); }
};
