<?php

namespace App\Http\Controllers;

use App\Models\Bibliotheque;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BibliothequeController extends Controller
{
    public function index(Request $request)
    {
        $query = Bibliotheque::query()->where('id_admin', $request->user()->id_admin);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('nom', 'like', "%{$s}%");
        }

        if ($request->filled('type') && $request->type !== 'tous') {
            $query->where('type', $request->type);
        }

        $files = $query->orderByDesc('created_at')->paginate(20);
        $totalSize = Bibliotheque::query()->where('id_admin', $request->user()->id_admin)->sum('taille'); // octets

        return response()->json([
            'data' => $files->items(),
            'current_page' => $files->currentPage(),
            'last_page' => $files->lastPage(),
            'total' => $files->total(),
            'total_size' => (int) $totalSize,
            'max_size' => 5 * 1024 * 1024 * 1024, // 5 Go
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'fichier' => 'required|file|max:20480', // 20 Mo
        ]);

        $file = $request->file('fichier');
        $extension = strtolower($file->getClientOriginalExtension());
        $nom = $file->getClientOriginalName();
        $taille = $file->getSize();

        $type = match (true) {
            in_array($extension, ['pdf']) => 'pdf',
            in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']) => 'image',
            in_array($extension, ['doc', 'docx']) => 'word',
            in_array($extension, ['xls', 'xlsx', 'csv']) => 'excel',
            in_array($extension, ['ppt', 'pptx']) => 'powerpoint',
            default => 'autre',
        };

        $chemin = $file->store('bibliotheque', 'public');

        $fichier = Bibliotheque::create([
            'id_admin'  => $user->id_admin,
            'nom'       => $nom,
            'type'      => $type,
            'chemin'    => $chemin,
            'taille'    => $taille,
            'extension' => $extension,
        ]);

        return response()->json(['message' => 'Fichier téléversé', 'fichier' => $fichier], 201);
    }

    public function download(Request $request, int $id)
    {
        $fichier = Bibliotheque::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id);

        $path = storage_path('app/public/' . $fichier->chemin);

        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($path, $fichier->nom);
    }

    public function destroy(Request $request, int $id)
    {
        $fichier = Bibliotheque::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id);

        if ($fichier->chemin && Storage::disk('public')->exists($fichier->chemin)) {
            Storage::disk('public')->delete($fichier->chemin);
        }

        $fichier->delete();

        return response()->json(['message' => 'Fichier supprimé']);
    }
}
