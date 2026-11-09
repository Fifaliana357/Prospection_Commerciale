<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospection_email_sync_state', function (Blueprint $table) {
            $table->string('mailbox', 191)->primary();
            $table->unsignedBigInteger('last_uid')->default(0);
            $table->unsignedBigInteger('uid_validity')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospection_email_sync_state');
    }
};
