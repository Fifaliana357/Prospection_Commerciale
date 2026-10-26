<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id('id_rendez_vous');
            $table->foreignId('id_commercial')->nullable()->constrained('commercial', 'id_commercial')->onDelete('set null');
            $table->foreignId('id_client')->constrained('client', 'id_client')->onDelete('cascade');
            $table->dateTime('date_heure');
            $table->string('titre')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('rendez_vous'); }
};