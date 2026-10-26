<?php

namespace App\Traits;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

trait ScopesToOwner
{
    /**
     * Applique le scope (admin OU commercial) sur une requête.
     */
    protected function scopeToOwner(Builder $query, Model $user): Builder
    {
        if ($user instanceof Admin) {
            return $query->where('id_admin', $user->id_admin);
        }

        return $query->where('id_commercial', $user->id_commercial);
    }

    /**
     * Vérifie qu'un modèle appartient bien à l'utilisateur courant.
     */
    protected function authorizeOwnership(Model $model, Model $user): void
    {
        $allowed = $user instanceof Admin
            ? $model->id_admin === $user->id_admin
            : $model->id_commercial === $user->id_commercial;

        if (! $allowed) {
            throw new AccessDeniedHttpException('Non autorisé.');
        }
    }
}