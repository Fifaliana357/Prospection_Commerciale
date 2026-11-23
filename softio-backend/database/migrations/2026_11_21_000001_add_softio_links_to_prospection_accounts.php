<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin', function (Blueprint $table): void {
            $table->unsignedBigInteger('softio_user_id')->nullable()->unique();
            $table->unsignedBigInteger('softio_organisation_id')->nullable()->unique();
        });

        Schema::table('commercial', function (Blueprint $table): void {
            $table->unsignedBigInteger('softio_user_id')->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('commercial', function (Blueprint $table): void {
            $table->dropUnique(['softio_user_id']);
            $table->dropColumn('softio_user_id');
        });

        Schema::table('admin', function (Blueprint $table): void {
            $table->dropUnique(['softio_organisation_id']);
            $table->dropUnique(['softio_user_id']);
            $table->dropColumn(['softio_user_id', 'softio_organisation_id']);
        });
    }
};
