<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->actionableNotifications($request)->orderByDesc('notification.created_at');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('notification.titre', 'like', "%{$search}%")
                    ->orWhere('notification.sous_titre', 'like', "%{$search}%")
                    ->orWhere('notification.nom_client', 'like', "%{$search}%")
                    ->orWhere('notification.id_prospection', 'like', "%{$search}%")
                    ->orWhere('notification.contenu', 'like', "%{$search}%");
            });
        }

        $filtre = $request->get('filtre', 'toutes');
        if ($filtre === 'non_lues') {
            $query->where('notification.lu', false);
        } elseif (in_array($filtre, ['message', 'rdv'])) {
            $query->where('notification.type', $filtre);
        }

        $items = $query->paginate(20);

        $counts = [
            'non_lues' => (clone $this->actionableNotifications($request))->where('notification.lu', false)->count(),
            'message'  => (clone $this->actionableNotifications($request))
                ->where('notification.type', 'message')
                ->where('notification.lu', false)
                ->count(),
            'rdv'      => (clone $this->actionableNotifications($request))
                ->where('notification.type', 'rdv')
                ->where('notification.lu', false)
                ->count(),
        ];

        return response()->json([
            'data' => $items->items(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
            'counts' => $counts,
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        $n = $this->actionableNotifications($request)->findOrFail($id);
        $n->update(['lu' => true]);
        return response()->json(['message' => 'Marquée comme lue']);
    }

    public function markAllRead(Request $request)
    {
        $this->actionableNotifications($request)->where('lu', false)->update(['lu' => true]);
        return response()->json(['message' => 'Toutes marquées comme lues']);
    }

    public function destroy(Request $request, int $id)
    {
        $notification = $this->actionableNotifications($request)->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification supprimée']);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $this->actionableNotifications($request)->where('lu', false)->count(),
        ]);
    }

    private function visibleNotifications(Request $request): Builder
    {
        $user = $request->user();
        $query = Notification::query()->where('notification.id_admin', $user->id_admin);

        if (! $user instanceof Admin) {
            $query->where('notification.id_commercial', $user->id_commercial);
        }

        return $query;
    }

    private function actionableNotifications(Request $request): Builder
    {
        return $this->visibleNotifications($request)
            ->where(function (Builder $query) {
                $query->where(function (Builder $message) {
                    $message->where('notification.type', 'message')
                        ->whereNotNull('notification.id_prospection')
                        ->whereExists(function ($prospection) {
                            $prospection->selectRaw('1')
                                ->from('prospection')
                                ->whereColumn('prospection.id_prospection', 'notification.id_prospection')
                                ->whereColumn('prospection.id_admin', 'notification.id_admin')
                                ->where(function ($owner) {
                                    $owner->whereNull('notification.id_commercial')
                                        ->orWhereColumn('prospection.id_commercial', 'notification.id_commercial');
                                });
                        });
                })->orWhere(function (Builder $appointment) {
                    $appointment->where('notification.type', 'rdv')
                        ->whereNotNull('notification.id_rdv')
                        ->whereExists(function ($rdv) {
                            $rdv->selectRaw('1')
                                ->from('rendez_vous')
                                ->whereColumn('rendez_vous.id_rendez_vous', 'notification.id_rdv')
                                ->whereColumn('rendez_vous.id_admin', 'notification.id_admin')
                                ->where(function ($owner) {
                                    $owner->whereNull('notification.id_commercial')
                                        ->orWhereColumn('rendez_vous.id_commercial', 'notification.id_commercial');
                                });
                        });
                });
            });
    }
}
