<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('prospections', function (Blueprint $table) {
            $table->string('matricule', 50)->nullable()->after('id');
            $table->string('produit', 191)->nullable()->after('fonction');
            $table->string('type', 50)->default('Email')->after('produit');
            $table->text('message')->nullable()->after('type');
        });

        Schema::table('prospects', function (Blueprint $table) {
            $table->string('profession', 100)->nullable()->after('domaine');
            $table->string('linkedin', 191)->nullable()->after('profession');
            $table->string('facebook', 191)->nullable()->after('linkedin');
            $table->string('siteweb', 191)->nullable()->after('facebook');
            $table->text('interets')->nullable()->after('siteweb');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prospections', function (Blueprint $table) {
            $table->dropColumn(['matricule', 'produit', 'type', 'message']);
        });

        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn(['profession', 'linkedin', 'facebook', 'siteweb', 'interets']);
        });
    }
};
