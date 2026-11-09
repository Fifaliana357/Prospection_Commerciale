<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('proposition')) {
            return;
        }

        Schema::table('proposition', function (Blueprint $table) {
            if (!Schema::hasColumn('proposition', 'mail_message_id')) {
                $table->string('mail_message_id')->nullable()->unique();
            }

            if (!Schema::hasColumn('proposition', 'mail_uid')) {
                $table->string('mail_uid')->nullable()->unique();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('proposition')) {
            return;
        }

        Schema::table('proposition', function (Blueprint $table) {
            if (Schema::hasColumn('proposition', 'mail_uid')) {
                $table->dropColumn('mail_uid');
            }

            if (Schema::hasColumn('proposition', 'mail_message_id')) {
                $table->dropColumn('mail_message_id');
            }
        });
    }
};
