<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin', function (Blueprint $table) {
            $table->id('id_admin');
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('entreprise')->nullable();
            $table->string('password');
            $table->string('token')->nullable();
            $table->boolean('est_verifie')->default(false);
            $table->string('theme_preference')->nullable();
            $table->string('pass_token')->nullable();
            $table->boolean('is_first_login')->default(true);
            $table->string('nom_repertoire')->nullable();
            $table->boolean('est_admin_site')->default(false);
            $table->longText('signature')->nullable();
            $table->integer('signature_width')->nullable();
            $table->integer('signature_height')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin');
    }
};