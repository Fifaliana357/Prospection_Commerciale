<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('vente') && ! Schema::hasColumn('vente', 'remarque')) {
            Schema::table('vente', function (Blueprint $table) {
                $table->text('remarque')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('vente') && Schema::hasColumn('vente', 'remarque')) {
            Schema::table('vente', function (Blueprint $table) {
                $table->dropColumn('remarque');
            });
        }
    }
};
