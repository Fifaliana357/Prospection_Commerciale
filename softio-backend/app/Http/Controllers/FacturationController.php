<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Commercial;
use App\Models\Devis;
use App\Models\Entreprise;
use App\Models\LigneDevis;
use App\Models\LigneVente;
use App\Models\Offre;
use App\Models\Produit;
use App\Models\StockMouvement;
use App\Models\Vente;
use App\Jobs\SendFacturationEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class FacturationController extends Controller
{
    public function catalog(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'clients' => $this->ownedClients($user)
                ->orderBy('nom')
                ->get(['id_client', 'nom', 'prenom', 'entreprise', 'email', 'telephone']),
            'produits' => Produit::query()
                ->where('id_admin', $user->id_admin)
                ->where('actif', true)
                ->orderBy('designation')
                ->get(['id_produit', 'reference', 'designation', 'prix_unitaire', 'actif']),
            'services' => Offre::query()
                ->where('id_admin', $user->id_admin)
                ->where('actif', true)
                ->orderBy('denomination')
                ->get(['id_offre', 'denomination', 'tarif', 'actif']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Devis::query()
            ->with([
                'client:id_client,nom,prenom,entreprise,email,telephone',
                'commercial:id_commercial,nom,prenom',
                'admin:id_admin,nom,prenom',
                'lignes',
                'vente:id_vente,id_devis',
            ])
            ->withCount('lignes')
            ->where('id_admin', $user->id_admin);

        $view = $request->query('view', 'liste');
        if ($view === 'brouillons') {
            $query->where('statut', 'brouillon');
        } else {
            $query->where('statut', '!=', 'brouillon');
        }

        if ($request->filled('type') && $request->query('type') !== 'tous') {
            if (in_array($request->query('type'), ['produit', 'service'], true)) {
                $query->whereHas('lignes', fn (Builder $lineQuery) => $lineQuery
                    ->where('type_ligne', $request->query('type')));
            }
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('numero', 'like', "%{$search}%")
                    ->orWhereHas('client', function (Builder $clientQuery) use ($search) {
                        $clientQuery->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%")
                            ->orWhere('entreprise', 'like', "%{$search}%");
                    });
            });
        }

        $query->when($request->filled('date_from'), fn (Builder $builder) => $builder
            ->whereDate('date_devis', '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn (Builder $builder) => $builder
                ->whereDate('date_devis', '<=', $request->query('date_to')));

        $documents = $query->orderByDesc('date_devis')->orderByDesc('id_devis')->paginate(10);
        $documents->getCollection()->each(function (Devis $document) {
            $document->setAttribute('editor_name', $this->editorName($document));
        });

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);
        $document = DB::transaction(fn () => $this->saveDocument($request, $validated));

        return response()->json([
            'message' => 'Brouillon enregistré.',
            'document' => $document,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $document = $this->ownedDocuments($request->user())
            ->with([
                'client',
                'commercial',
                'admin:id_admin,nom,prenom',
                'lignes.produit:id_produit,reference',
                'lignes.offre:id_offre',
                'vente',
            ])
            ->findOrFail($id);
        $document->setAttribute('editor_name', $this->editorName($document));

        return response()->json($document);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validatedPayload($request);
        $document = DB::transaction(function () use ($request, $validated, $id) {
            $existing = $this->ownedDocuments($request->user())
                ->lockForUpdate()
                ->findOrFail($id);

            if ($existing->statut !== 'brouillon') {
                abort(response()->json([
                    'message' => 'Seuls les brouillons peuvent être modifiés.',
                ], 422));
            }

            return $this->saveDocument($request, $validated, $existing);
        });

        return response()->json([
            'message' => 'Brouillon mis à jour.',
            'document' => $document,
        ]);
    }

    public function validateDocument(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $document = DB::transaction(function () use ($request, $id, $user) {
            $document = $this->ownedDocuments($user)
                ->with('lignes')
                ->lockForUpdate()
                ->findOrFail($id);

            if ($document->statut !== 'brouillon') {
                abort(response()->json(['message' => 'Ce document est déjà validé.'], 422));
            }

            $client = $this->ownedClients($user)->findOrFail($document->id_client);
            if ($document->type === 'facture') {
                $this->createSale($document, $client);
            }

            $document->update(['statut' => 'valide']);

            return $document->fresh()->load([
                'client',
                'commercial',
                'admin:id_admin,nom,prenom',
                'lignes.produit:id_produit,reference',
                'vente',
            ]);
        });
        $document->setAttribute('editor_name', $this->editorName($document));

        return response()->json([
            'message' => 'Document validé.',
            'document' => $document,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $document = $this->ownedDocuments($request->user())->findOrFail($id);
        if ($document->vente()->exists()) {
            return response()->json([
                'message' => 'Ce document est lié à une vente et ne peut pas être supprimé.',
            ], 422);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprimé.']);
    }

    public function downloadPdf(Request $request, int $id): Response
    {
        $options = $this->validatePdfOptions($request);
        $format = $options['format'] ?? 'A4';
        $document = $this->ownedDocuments($request->user())
            ->with(['client', 'lignes', 'commercial', 'admin:id_admin,nom,prenom'])
            ->findOrFail($id);
        $barcodeSvg = $format === 'Ticket'
            ? $this->sanitizeBarcodeSvg($options['barcode_svg'] ?? null)
            : null;
        $pdfBytes = $this->renderDocumentPdf($document, $format, $barcodeSvg, $options);
        $typeLabel = match ($document->type) {
            'facture' => 'Facture',
            'devis' => 'Devis',
            default => 'Facture proforma',
        };
        $filename = Str::slug($typeLabel . '-' . $document->numero) . '.pdf';

        return response($pdfBytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function sendEmail(Request $request, int $id): JsonResponse
    {
        $options = $this->validatePdfOptions($request);
        $document = $this->ownedDocuments($request->user())
            ->with(['client', 'lignes', 'commercial', 'admin:id_admin,nom,prenom'])
            ->findOrFail($id);

        if ($document->statut !== 'valide') {
            return response()->json(['message' => 'Validez le document avant de l’envoyer.'], 422);
        }

        $email = $document->client?->email;
        if (! $email) {
            return response()->json([
                'message' => 'Ce client ne possède pas d’adresse e-mail.',
            ], 422);
        }

        $format = $options['format'] ?? 'A4';
        $barcodeSvg = $format === 'Ticket'
            ? $this->sanitizeBarcodeSvg($options['barcode_svg'] ?? null)
            : null;
        $company = Entreprise::query()
            ->where('id_admin', $document->id_admin)
            ->when($document->id_entreprise, fn (Builder $query) => $query->where('id_entreprise', $document->id_entreprise))
            ->orderBy('id_entreprise')
            ->first();
        $companyName = $company?->nom_entreprise ?: 'L’équipe commerciale';
        $clientName = trim(($document->client->prenom ?? '') . ' ' . ($document->client->nom ?? ''));
        $typeLabel = match ($document->type) {
            'facture' => 'Facture',
            'devis' => 'Devis',
            default => 'Facture proforma',
        };
        $pdfBytes = $this->renderDocumentPdf($document, $format, $barcodeSvg, $options);
        $emailBody = view('emails.facturation', compact(
            'document',
            'clientName',
            'companyName',
            'typeLabel',
        ))->render();
        $attachmentName = Str::slug($typeLabel . '-' . $document->numero) . '.pdf';
        $subject = $typeLabel . ' n° ' . $document->numero;

        SendFacturationEmail::dispatch($email, $subject, $emailBody, $pdfBytes, $attachmentName)
            ->afterResponse();

        return response()->json(['message' => "E-mail en cours d’envoi à {$email}."]);
    }

    private function validatePdfOptions(Request $request): array
    {
        return $request->validate([
            'format' => 'nullable|in:A4,A5,Ticket',
            'barcode_svg' => 'nullable|string|max:200000',
            'stampWidth' => 'nullable|numeric|min:40|max:500',
            'stampX' => 'nullable|numeric|min:-500|max:500',
            'stampY' => 'nullable|numeric|min:-500|max:500',
            'stampRotation' => 'nullable|numeric|min:-360|max:360',
            'signatureWidth' => 'nullable|numeric|min:40|max:500',
            'signatureX' => 'nullable|numeric|min:-500|max:500',
            'signatureY' => 'nullable|numeric|min:-500|max:500',
            'signatureRotation' => 'nullable|numeric|min:-360|max:360',
        ]);
    }

    private function renderDocumentPdf(Devis $document, string $format, ?string $barcodeSvg, array $options): string
    {
        $companyQuery = Entreprise::query()
            ->where('id_admin', $document->id_admin)
            ->orderBy('id_entreprise');
        if ($document->id_entreprise) {
            $companyQuery->where('id_entreprise', $document->id_entreprise);
        }
        $company = $companyQuery->first();
        $companyLogoPath = $company?->logo ? $this->publicFilePath($company->logo) : null;
        $companyCachetPath = $company?->cachet ? $this->publicFilePath($company->cachet) : null;
        $companySignaturePath = $company?->signature ? $this->publicFilePath($company->signature) : null;
        $editorName = $this->editorName($document);
        $clientName = trim(($document->client->prenom ?? '') . ' ' . ($document->client->nom ?? ''));
        $typeLabel = match ($document->type) {
            'facture' => 'Facture',
            'devis' => 'Devis',
            default => 'Facture proforma',
        };
        $lineSubtotal = (int) $document->lignes->sum('montant');
        $vatAmount = max(0, (int) $document->montant_ttc - (int) $document->montant_ht);
        $amountInWords = $this->amountInFrenchWords((int) $document->montant_ttc);
        $pdf = Pdf::loadView('pdf.facturation', compact(
            'document',
            'company',
            'companyLogoPath',
            'companyCachetPath',
            'companySignaturePath',
            'editorName',
            'clientName',
            'typeLabel',
            'lineSubtotal',
            'vatAmount',
            'amountInWords',
            'format',
            'barcodeSvg',
            'options',
        ));

        if ($format === 'Ticket') {
            $contentHeight = 460 + $document->lignes->sum(
                fn ($line) => 64 + (int) ceil(mb_strlen((string) $line->designation) / 28) * 12,
            );
            return $pdf->setPaper([0, 0, 226.77, $contentHeight])->output();
        }

        return $pdf->setPaper(strtolower($format))->output();
    }

    private function sanitizeBarcodeSvg(?string $svg): ?string
    {
        if ($svg === null || $svg === '') {
            return null;
        }

        $dom = new \DOMDocument();
        $previousErrorMode = libxml_use_internal_errors(true);
        try {
            if (! $dom->loadXML($svg, LIBXML_NONET | LIBXML_NOBLANKS) || $dom->documentElement?->localName !== 'svg') {
                abort(422, 'Le code-barres du ticket est invalide.');
            }

            $this->sanitizeBarcodeNode($dom->documentElement);

            return $dom->saveXML($dom->documentElement) ?: null;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorMode);
        }
    }

    private function sanitizeBarcodeNode(\DOMNode $node): void
    {
        $allowedElements = ['svg', 'g', 'rect', 'path'];
        $allowedAttributes = ['xmlns', 'width', 'height', 'viewBox', 'x', 'y', 'd', 'fill'];

        for ($index = $node->childNodes->length - 1; $index >= 0; $index--) {
            $child = $node->childNodes->item($index);
            if (! $child) {
                continue;
            }
            if ($child instanceof \DOMElement) {
                if (! in_array($child->localName, $allowedElements, true)) {
                    $node->removeChild($child);
                    continue;
                }
                $this->sanitizeBarcodeNode($child);
            } elseif (! ($child instanceof \DOMText && trim($child->textContent) === '')) {
                $node->removeChild($child);
            }
        }

        if (! $node instanceof \DOMElement) {
            return;
        }
        for ($index = $node->attributes->length - 1; $index >= 0; $index--) {
            $attribute = $node->attributes->item($index);
            if (! $attribute) {
                continue;
            }
            $validValue = $attribute->name === 'xmlns'
                ? $attribute->value === 'http://www.w3.org/2000/svg'
                : preg_match('/^[#A-Za-z0-9.,%\\s+-]*$/', $attribute->value) === 1;
            if (! in_array($attribute->name, $allowedAttributes, true) || ! $validValue) {
                $node->removeAttributeNode($attribute);
            }
        }
    }

    private function editorName(Devis $document): string
    {
        $editor = $document->commercial ?? $document->admin;
        $name = trim(($editor?->prenom ?? '') . ' ' . ($editor?->nom ?? ''));

        return $name !== '' ? $name : 'Administrateur';
    }

    private function publicFilePath(string $relativePath): string
    {
        $root = (string) config('filesystems.disks.public.root', storage_path('app/public'));

        return rtrim($root, '/\\') . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    }

    private function amountInFrenchWords(int $amount): string
    {
        $amount = max(0, $amount);
        if ($amount === 0) {
            return 'Zéro';
        }

        $scales = ['', 'mille', 'million', 'milliard', 'billion', 'billiard'];
        $parts = [];
        $scale = 0;
        while ($amount > 0) {
            $group = $amount % 1000;
            if ($group > 0) {
                $words = $this->underThousandInFrench($group);
                if ($scale === 1 && $group === 1) {
                    $words = 'mille';
                } elseif ($scale > 1) {
                    $words .= ' ' . $scales[$scale] . ($group > 1 ? 's' : '');
                } elseif ($scale === 1) {
                    $words .= ' mille';
                }
                array_unshift($parts, $words);
            }
            $amount = intdiv($amount, 1000);
            $scale++;
        }

        $words = implode(' ', $parts);

        return mb_strtoupper(mb_substr($words, 0, 1, 'UTF-8'), 'UTF-8')
            . mb_substr($words, 1, null, 'UTF-8');
    }

    private function underThousandInFrench(int $number): string
    {
        $small = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
        if ($number < 17) {
            return $small[$number];
        }
        if ($number < 20) {
            return 'dix-' . $small[$number - 10];
        }
        if ($number < 70) {
            $tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
            $decade = intdiv($number, 10);
            $unit = $number % 10;
            if ($unit === 0) {
                return $tens[$decade];
            }
            return $unit === 1
                ? $tens[$decade] . ' et un'
                : $tens[$decade] . '-' . $small[$unit];
        }
        if ($number < 80) {
            return $number === 71
                ? 'soixante et onze'
                : 'soixante-' . $this->underThousandInFrench($number - 60);
        }
        if ($number < 100) {
            return $number === 80
                ? 'quatre-vingts'
                : 'quatre-vingt-' . $this->underThousandInFrench($number - 80);
        }

        $hundreds = intdiv($number, 100);
        $remainder = $number % 100;
        $words = ($hundreds === 1 ? '' : $small[$hundreds] . ' ') . 'cent';
        if ($remainder === 0) {
            return $hundreds > 1 ? $words . 's' : $words;
        }
        return $words . ' ' . $this->underThousandInFrench($remainder);
    }

    private function validatedPayload(Request $request): array
    {
        return $request->validate([
            'id_client' => 'required|integer|exists:client,id_client',
            'type' => 'required|in:devis,proforma,facture',
            'date_devis' => 'required|date',
            'intitule' => 'nullable|string|max:255',
            'remarque' => 'nullable|string',
            'remise_globale' => 'nullable|integer|min:0',
            'inclure_tva' => 'required|boolean',
            'taux_tva' => 'required|numeric|min:0|max:100',
            'lignes' => 'required|array|min:1',
            'lignes.*.type_ligne' => 'required|in:produit,service',
            'lignes.*.id_produit' => 'nullable|integer|exists:produit,id_produit',
            'lignes.*.id_offre' => 'nullable|integer|exists:offre,id_offre',
            'lignes.*.quantite' => 'required|integer|min:1',
            'lignes.*.remise' => 'nullable|integer|min:0',
        ]);
    }

    private function saveDocument(Request $request, array $validated, ?Devis $existing = null): Devis
    {
        $user = $request->user();
        $client = $this->ownedClients($user)->findOrFail($validated['id_client']);
        $lineData = [];
        $subtotal = 0;

        foreach ($validated['lignes'] as $index => $line) {
            $type = $line['type_ligne'];
            if ($type === 'produit') {
                if (empty($line['id_produit']) || ! empty($line['id_offre'])) {
                    abort(response()->json(['message' => 'Sélectionnez un produit pour cette ligne.'], 422));
                }
                $item = Produit::query()
                    ->where('id_admin', $user->id_admin)
                    ->where('actif', true)
                    ->findOrFail($line['id_produit']);
                $designation = $item->designation;
                $description = $item->description;
                $unitPrice = (int) $item->prix_unitaire;
                $productId = $item->id_produit;
                $offerId = null;
            } else {
                if (empty($line['id_offre']) || ! empty($line['id_produit'])) {
                    abort(response()->json(['message' => 'Sélectionnez un service pour cette ligne.'], 422));
                }
                $item = Offre::query()
                    ->where('id_admin', $user->id_admin)
                    ->where('actif', true)
                    ->findOrFail($line['id_offre']);
                $designation = $item->denomination;
                $description = $item->description;
                $unitPrice = (int) $item->tarif;
                $productId = null;
                $offerId = $item->id_offre;
            }

            $gross = $unitPrice * (int) $line['quantite'];
            $discount = (int) ($line['remise'] ?? 0);
            if ($discount > $gross) {
                abort(response()->json(['message' => "La remise dépasse le montant de la ligne « {$designation} »."], 422));
            }

            $amount = $gross - $discount;
            $subtotal += $amount;
            $lineData[] = [
                'id_produit' => $productId,
                'id_offre' => $offerId,
                'type_ligne' => $type,
                'designation' => $designation,
                'description' => $description,
                'quantite' => $line['quantite'],
                'prix_unitaire' => $unitPrice,
                'remise' => $discount,
                'montant' => $amount,
                'ordre' => $index,
            ];
        }

        $globalDiscount = (int) ($validated['remise_globale'] ?? 0);
        if ($globalDiscount > $subtotal) {
            abort(response()->json(['message' => 'La remise globale dépasse le total des lignes.'], 422));
        }
        $totalHt = $subtotal - $globalDiscount;
        $totalTtc = $totalHt + ($validated['inclure_tva']
            ? (int) round($totalHt * (float) $validated['taux_tva'] / 100)
            : 0);

        $attributes = [
            'id_admin' => $user->id_admin,
            'id_commercial' => $user instanceof Commercial ? $user->id_commercial : null,
            'id_client' => $client->id_client,
            'type' => $validated['type'],
            'date_devis' => $validated['date_devis'],
            'intitule' => $validated['intitule'] ?? null,
            'montant_ht' => $totalHt,
            'montant_ttc' => $totalTtc,
            'remise_globale' => $globalDiscount,
            'inclure_tva' => $validated['inclure_tva'],
            'taux_tva' => $validated['taux_tva'],
            'statut' => 'brouillon',
            'remarque' => $validated['remarque'] ?? null,
        ];

        if ($existing) {
            $existing->update($attributes);
            $document = $existing;
            $document->lignes()->delete();
        } else {
            $document = Devis::create([
                ...$attributes,
                'numero' => (string) Str::uuid(),
            ]);
            $document->update([
                'numero' => now()->format('Y') . '-' . str_pad((string) $document->id_devis, 4, '0', STR_PAD_LEFT),
            ]);
        }

        $document->lignes()->createMany($lineData);

        return $document->load(['client', 'lignes']);
    }

    private function createSale(Devis $document, Client $client): void
    {
        if ($document->vente()->exists()) {
            abort(response()->json(['message' => 'Une facture existe déjà pour ce document.'], 422));
        }

        $quantities = [];
        foreach ($document->lignes as $line) {
            if ($line->type_ligne === 'produit' && $line->id_produit) {
                $quantities[$line->id_produit] = ($quantities[$line->id_produit] ?? 0) + (int) $line->quantite;
            }
        }

        foreach ($quantities as $productId => $quantity) {
            $product = Produit::query()
                ->where('id_admin', $document->id_admin)
                ->lockForUpdate()
                ->findOrFail($productId);
            $stock = (int) $product->mouvementsStock()->where('type_mouvement', 'entree')->sum('quantite')
                - (int) $product->mouvementsStock()->where('type_mouvement', 'sortie')->sum('quantite');

            if ($stock < $quantity) {
                abort(response()->json([
                    'message' => "Stock insuffisant pour {$product->designation}.",
                    'stock_actuel' => $stock,
                ], 422));
            }
        }

        $sale = Vente::create([
            'id_admin' => $document->id_admin,
            'id_commercial' => $document->id_commercial,
            'id_client' => $client->id_client,
            'id_devis' => $document->id_devis,
            'numero' => $document->numero,
            'type_document' => 'facture',
            'date_vente' => $document->date_devis,
            'intitule' => $document->intitule,
            'montant_ht' => $document->montant_ht,
            'montant_ttc' => $document->montant_ttc,
            'montant_total' => $document->montant_ttc,
            'inclure_tva' => $document->inclure_tva,
            'taux_tva' => $document->taux_tva,
            'statut' => 'validee',
            'methode_paiement' => $document->methode_paiement,
            'modalites' => $document->modalites,
        ]);

        foreach ($document->lignes as $line) {
            LigneVente::create([
                'id_vente' => $sale->id_vente,
                'id_produit' => $line->id_produit,
                'id_offre' => $line->id_offre,
                'type_ligne' => $line->type_ligne,
                'designation' => $line->designation,
                'description' => $line->description,
                'quantite' => $line->quantite,
                'prix_unitaire' => $line->prix_unitaire,
                'remise' => $line->remise,
                'montant' => $line->montant,
                'ordre' => $line->ordre,
            ]);

            if ($line->type_ligne === 'produit' && $line->id_produit) {
                StockMouvement::create([
                    'id_produit' => $line->id_produit,
                    'id_admin' => $document->id_admin,
                    'id_commercial' => $document->id_commercial,
                    'type_mouvement' => 'sortie',
                    'quantite' => (int) $line->quantite,
                    'reference' => 'VENTE-' . $sale->id_vente,
                    'commentaire' => 'Déduction automatique après validation de la facture ' . $document->numero,
                    'date_mouvement' => now(),
                ]);
            }
        }
    }

    private function ownedDocuments(Admin|Commercial $user): Builder
    {
        return Devis::query()->where('id_admin', $user->id_admin);
    }

    private function ownedClients(Admin|Commercial $user): Builder
    {
        return Client::query()->where('id_admin', $user->id_admin);
    }
}
