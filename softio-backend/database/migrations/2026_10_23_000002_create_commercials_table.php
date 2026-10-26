<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commercial', function (Blueprint $table) {
            $table->id('id_commercial');
            $table->foreignId('id_admin')->constrained('admin', 'id_admin')->onDelete('cascade');
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('password');
            $table->string('theme_preference')->nullable();
            $table->string('pass_token')->nullable();
            $table->boolean('is_first_login')->default(true);
            $table->longText('signature')->nullable();
            $table->integer('signature_width')->nullable();
            $table->integer('signature_height')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commercial');
    }
};