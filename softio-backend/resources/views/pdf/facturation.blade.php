<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @if ($format === 'Ticket')
        @page { margin: 4mm; }
        @else
        @page { size: {{ $format }}; margin: 12mm; }
        @endif
        body { color: #111827; font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        .top { margin-bottom: 22px; width: 100%; }
        .top td { vertical-align: top; width: 50%; }
        .company, .recipient { border: 1px dashed #7b858b; color: #26343b; line-height: 1.55; min-height: 112px; padding: 10px; }
        .company-logo { display: block; margin-bottom: 8px; max-height: 64px; max-width: 210px; }
        h1 { color: #111827; font-size: 20px; margin: 0 0 6px; text-align: left; }
        .number { color: #111827; font-size: 11px; margin-bottom: 14px; text-align: left; }
        .label { color: #111827; font-size: 9px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .section { margin-bottom: 7px; }
        .recipient { margin-top: 12px; }
        table.lines { border-collapse: collapse; border-top: 2px solid #176a70; width: 100%; }
        .lines th { background: #f3f6f6; border: 1px solid #111; color: #26343b; font-size: 9px; padding: 9px 7px; text-align: left; }
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
        .stamp-box { height: 140px; position: relative; width: 340px; }
        .stamp-box img { max-height: 120px; max-width: 90%; position: absolute; }
        body.ticket { font-size: 9px; page-break-inside: avoid; width: 72mm; }
        .ticket * { page-break-inside: avoid; }
        .ticket .top, .ticket .top tbody, .ticket .top tr, .ticket .top td { display: block; width: 100%; }
        .ticket .top { margin-bottom: 10px; }
        .ticket .company, .ticket .recipient { border: 0; min-height: 0; padding: 4px 0; }
        .ticket .recipient { border-top: 1px dashed #7b858b; margin-top: 7px; }
        .ticket h1 { font-size: 14px; text-align: center; }
        .ticket .number { font-size: 9px; text-align: center; }
        .ticket .label { font-size: 8px; }
        .ticket .totals { margin-top: 8px; width: 100%; }
        .ticket .amount-words, .ticket .notes { font-size: 9px; margin-top: 10px; }
        .ticket .stamp, .ticket .footer { margin-top: 12px; }
        .ticket .ticket-line { border-bottom: 1px dashed #d1d5db; padding: 5px 0; }
        .ticket .ticket-barcode { margin-top: 14px; text-align: center; }
        .ticket .ticket-barcode svg { max-width: 100%; height: auto; }
    </style>
</head>
<body class="{{ $format === 'Ticket' ? 'ticket' : '' }}">
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
                <h1>{{ $typeLabel }}@if ($format !== 'Ticket') N° {{ $document->numero }}@endif</h1>
                <div class="number">
                    @if (filled($company?->adresse)){{ $company->adresse }} le @endif
                    {{ $document->date_devis?->format('d/m/Y') }}
                </div>
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

    @if ($format === 'Ticket')
        <div class="ticket-lines">
            @foreach ($document->lignes as $line)
                <div class="ticket-line">
                    <strong>{{ $line->designation }}</strong><br>
                    {{ rtrim(rtrim(number_format((float) $line->quantite, 2, ',', ' '), '0'), ',') }}
                    × {{ number_format($line->prix_unitaire, 0, ',', ' ') }}
                    <span class="right">{{ number_format($line->montant, 0, ',', ' ') }}</span>
                </div>
            @endforeach
        </div>
    @else
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
                    <td class="right">{{ number_format($line->prix_unitaire, 0, ',', ' ') }}</td>
                    <td class="center">{{ rtrim(rtrim(number_format((float) $line->quantite, 2, ',', ' '), '0'), ',') }}</td>
                    <td class="right">{{ number_format($line->montant, 0, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @endif

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

    @if ($document->type === 'facture' && $format !== 'Ticket')
        <div class="stamp">
            <p>Le responsable</p>
            <div class="stamp-box">
                @if ($companyCachetPath && file_exists($companyCachetPath))
                    <img src="{{ $companyCachetPath }}" alt="Cachet de l’entreprise" style="width: {{ $options['stampWidth'] ?? 180 }}px; left: {{ 18 + ($options['stampX'] ?? 0) }}px; top: {{ 4 + ($options['stampY'] ?? 0) }}px; transform: rotate({{ $options['stampRotation'] ?? 0 }}deg);">
                @endif
                @if ($companySignaturePath && file_exists($companySignaturePath))
                    <img src="{{ $companySignaturePath }}" alt="Signature de l’entreprise" style="width: {{ $options['signatureWidth'] ?? 150 }}px; left: {{ 38 + ($options['signatureX'] ?? 0) }}px; top: {{ 10 + ($options['signatureY'] ?? 0) }}px; transform: rotate({{ $options['signatureRotation'] ?? 0 }}deg);">
                @endif
            </div>
            <p class="editor-name">{{ $editorName }}</p>
        </div>
    @endif

    @if ($barcodeSvg)
        <div class="ticket-barcode">{!! $barcodeSvg !!}</div>
    @endif

    <div class="footer">Document généré depuis Softio.</div>
</body>
</html>
