<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('prospection') && ! Schema::hasColumn('prospection', 'date_relance')) {
            Schema::table('prospection', function (Blueprint $table) {
                $table->date('date_relance')->nullable()->after('note_actuelle');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('prospection') && Schema::hasColumn('prospection', 'date_relance')) {
            Schema::table('prospection', function (Blueprint $table) {
                $table->dropColumn('date_relance');
            });
        }
    }
};
