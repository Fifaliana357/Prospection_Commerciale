<?php

namespace App\Http\Controllers;

use App\Models\SavTicket;
use Illuminate\Http\Request;

class SavTicketController extends Controller
{
    public function index(Request $request)
    {
        $query = SavTicket::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('num', 'like', "%{$search}%")
                  ->orWhere('client', 'like', "%{$search}%")
                  ->orWhere('sujet', 'like', "%{$search}%");
            });
        }

        if ($request->filled('statut') && $request->input('statut') !== 'Tous') {
            $query->where('statut', $request->input('statut'));
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'num' => 'nullable|string|max:50|unique:sav_tickets',
            'client' => 'required|string|max:150',
            'sujet' => 'required|string|max:191',
            'priorite' => 'required|in:Haute,Moyenne,Basse',
            'statut' => 'required|in:Ouvert,En cours,Résolu',
            'date' => 'required|string',
        ]);

        if (empty($validated['num'])) {
            $count = SavTicket::count() + 1;
            $validated['num'] = 'SAV-2026-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $ticket = SavTicket::create($validated);

        return response()->json($ticket, 201);
    }

    public function update(Request $request, SavTicket $savTicket)
    {
        $validated = $request->validate([
            'num' => 'sometimes|string|max:50|unique:sav_tickets,num,' . $savTicket->id,
            'client' => 'sometimes|string|max:150',
            'sujet' => 'sometimes|string|max:191',
            'priorite' => 'sometimes|in:Haute,Moyenne,Basse',
            'statut' => 'sometimes|in:Ouvert,En cours,Résolu',
            'date' => 'sometimes|string',
        ]);

        $savTicket->update($validated);

        return response()->json($savTicket);
    }

    public function destroy(SavTicket $savTicket)
    {
        $savTicket->delete();

        return response()->json(['message' => 'Ticket SAV supprimé']);
    }
}
