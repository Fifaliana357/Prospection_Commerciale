<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 34px 38px; }
        body { color: #111827; font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        .top { margin-bottom: 22px; width: 100%; }
        .top td { vertical-align: top; width: 50%; }
        .company, .recipient { border: 1px dashed #7b858b; color: #26343b; line-height: 1.55; min-height: 112px; padding: 10px; }
        .company-logo { display: block; margin-bottom: 8px; max-height: 64px; max-width: 210px; }
        h1 { color: #111827; font-size: 20px; margin: 0 0 6px; text-align: center; }
        .number { color: #111827; font-size: 11px; margin-bottom: 14px; text-align: center; }
        .label { color: #111827; font-size: 9px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .section { margin-bottom: 7px; }
        .recipient { margin-top: 12px; }
        table.lines { border-collapse: collapse; width: 100%; }
        .lines th { background: #fff; border: 1px solid #111; color: #26343b; font-size: 9px; padding: 9px 7px; text-align: left; }
        .lines td { border: 1px solid #111; padding: 9px 7px; }
        .right { text-align: right !important; }
        .center { text-align: center !important; }
        .totals { margin: 8px 0 0 auto; width: 260px; }
        .totals td { padding: 4px 0; }
        .grand-total { border-top: 2px solid #176a70; color: #176a70; font-size: 14px; font-weight: bold; }
        .notes { background: #f4f7f7; margin-top: 24px; padding: 12px; }
        .footer { border-top: 1px solid #dfe5e8; color: #71818a; font-size: 9px; margin-top: 34px; padding-top: 10px; text-align: center; }
        .amount-words { margin-top: 24px; }
        .stamp { margin-top: 20px; text-align: left; }
        .stamp-box { height: 110px; position: relative; width: 260px; }
        .stamp-box img { left: 18px; max-height: 90px; max-width: 220px; position: absolute; top: 4px; }
        .stamp-box .signature { left: 38px; max-height: 80px; max-width: 200px; top: 10px; }
    </style>
</head>
<body>
    <table class="top">
        <tr>
            <td>
                <div class="company">
            @if ($company)
            @if ($companyLogoPath && file_exists($companyLogoPath))
                <img class="company-logo" src="{{ $companyLogoPath }}" alt="Logo">
            @endif
            <strong>{{ $company->nom_entreprise }}</strong><br>
            @if ($company->adresse){{ $company->adresse }}<br>@endif
            @if ($company->telephone)Tél. : {{ $company->telephone }}<br>@endif
            @if ($company->email){{ $company->email }}<br>@endif
            @if ($company->nif)NIF : {{ $company->nif }} @endif
            @if ($company->stat) · STAT : {{ $company->stat }} @endif
            @if ($company->rcs) · RCS : {{ $company->rcs }} @endif
            @else
                <strong>Votre entreprise</strong>
            @endif
                </div>
            </td>
            <td>
                <h1>{{ $typeLabel }} N° {{ $document->numero }}</h1>
                <div class="number">{{ $document->date_devis?->format('d/m/Y') }}</div>
                <div class="recipient">
                    <div class="section label">Adressé à</div>
                    <strong>{{ $document->client->entreprise ?: $clientName }}</strong><br>
                    @if ($document->client->entreprise && $clientName){{ $clientName }}<br>@endif
                    @if ($document->client->email){{ $document->client->email }}<br>@endif
                    @if ($document->client->telephone){{ $document->client->telephone }}@endif
                    @if ($document->intitule)<br>{{ $document->intitule }}@endif
                </div>
            </td>
        </tr>
    </table>

    <table class="lines">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="right">PU (en {{ $document->type === 'facture' ? 'AR' : 'MGA' }})</th>
                <th class="center">Quantité</th>
                <th class="right">Montant (en {{ $document->type === 'facture' ? 'AR' : 'MGA' }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($document->lignes as $line)
                <tr>
                    <td>{{ $line->designation }}</td>
                    <td class="right">{{ number_format($line->prix_unitaire, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td>
                    <td class="center">{{ rtrim(rtrim(number_format((float) $line->quantite, 2, ',', ' '), '0'), ',') }}</td>
                    <td class="right">{{ number_format($line->montant, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Total des lignes</td><td class="right">{{ number_format($lineSubtotal, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td></tr>
        @if ($document->remise_globale > 0)
            <tr><td>Remise globale</td><td class="right">− {{ number_format($document->remise_globale, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td></tr>
        @endif
        <tr><td>Total HT</td><td class="right">{{ number_format($document->montant_ht, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td></tr>
        @if ($document->inclure_tva)
            <tr><td>TVA ({{ number_format($document->taux_tva, 2, ',', ' ') }} %)</td><td class="right">{{ number_format($vatAmount, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td></tr>
        @endif
        <tr class="grand-total"><td>Total TTC</td><td class="right">{{ number_format($document->montant_ttc, 0, ',', ' ') }} {{ $document->type === 'facture' ? 'AR' : 'MGA' }}</td></tr>
    </table>

    @if ($document->type === 'facture')
        <p class="amount-words">Arrêté à la somme de : {{ $amountInWords }} Ariary.</p>
    @endif

    @if ($document->remarque)
        <div class="notes"><strong>Remarque</strong><br>{{ $document->remarque }}</div>
    @endif

    @if ($document->type === 'facture')
        <div class="stamp">
            <p>Le responsable</p>
            <div class="stamp-box">
                @if ($companyCachetPath && file_exists($companyCachetPath))
                    <img src="{{ $companyCachetPath }}" alt="Cachet de l’entreprise">
                @endif
                @if ($companySignaturePath && file_exists($companySignaturePath))
                    <img class="signature" src="{{ $companySignaturePath }}" alt="Signature de l’entreprise">
                @endif
            </div>
            <p class="editor-name">{{ $editorName }}</p>
        </div>
    @endif

    <div class="footer">Document généré depuis Softio.</div>
</body>
</html>
