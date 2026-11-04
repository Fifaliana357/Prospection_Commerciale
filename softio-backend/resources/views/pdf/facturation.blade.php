<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 34px 38px; }
        body { color: #26343b; font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        .top { border-bottom: 3px solid #176a70; margin-bottom: 24px; padding-bottom: 16px; }
        .company { color: #53636b; line-height: 1.6; }
        .company-logo { display: block; margin-bottom: 8px; max-height: 56px; max-width: 180px; }
        h1 { color: #176a70; font-size: 23px; margin: 0 0 6px; }
        .number { color: #60717a; font-size: 12px; }
        .columns { margin: 20px 0 24px; width: 100%; }
        .columns td { vertical-align: top; width: 50%; }
        .label { color: #71818a; font-size: 9px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .section { margin-bottom: 7px; }
        table.lines { border-collapse: collapse; width: 100%; }
        .lines th { background: #fff; border: 1px solid #111; color: #26343b; font-size: 9px; padding: 9px 7px; text-align: left; }
        .lines td { border: 1px solid #111; padding: 9px 7px; }
        .right { text-align: right !important; }
        .center { text-align: center !important; }
        .totals { margin: 16px 0 0 auto; width: 260px; }
        .totals td { padding: 4px 0; }
        .grand-total { border-top: 2px solid #176a70; color: #176a70; font-size: 14px; font-weight: bold; }
        .notes { background: #f4f7f7; margin-top: 24px; padding: 12px; }
        .footer { border-top: 1px solid #dfe5e8; color: #71818a; font-size: 9px; margin-top: 34px; padding-top: 10px; text-align: center; }
        .stamp { margin-top: 26px; text-align: right; }
        .stamp img { max-height: 90px; max-width: 220px; }
    </style>
</head>
<body>
    <div class="top">
        <h1>{{ $typeLabel }}</h1>
        <div class="number">N° {{ $document->numero }} · Émis le {{ $document->date_devis?->format('d/m/Y') }}</div>
    </div>

    @if ($company)
        <div class="company">
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
        </div>
    @endif

    <table class="columns">
        <tr>
            <td>
                <div class="section label">Client</div>
                <strong>{{ $document->client->entreprise ?: $clientName }}</strong><br>
                @if ($document->client->entreprise && $clientName){{ $clientName }}<br>@endif
                @if ($document->client->email){{ $document->client->email }}<br>@endif
                @if ($document->client->telephone){{ $document->client->telephone }}@endif
            </td>
            <td class="right">
                <div class="section label">Document</div>
                {{ $document->intitule ?: $typeLabel }}<br>
                Statut : Validé
            </td>
        </tr>
    </table>

    <table class="lines">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="right">PU (en Ar)</th>
                <th class="center">Quantité</th>
                <th class="right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($document->lignes as $line)
                <tr>
                    <td>{{ $line->designation }}</td>
                    <td class="right">{{ number_format($line->prix_unitaire, 0, ',', ' ') }} Ar</td>
                    <td class="center">{{ rtrim(rtrim(number_format((float) $line->quantite, 2, ',', ' '), '0'), ',') }}</td>
                    <td class="right">{{ number_format($line->montant, 0, ',', ' ') }} Ar</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Total des lignes</td><td class="right">{{ number_format($lineSubtotal, 0, ',', ' ') }} Ar</td></tr>
        @if ($document->remise_globale > 0)
            <tr><td>Remise globale</td><td class="right">− {{ number_format($document->remise_globale, 0, ',', ' ') }} Ar</td></tr>
        @endif
        <tr><td>Total HT</td><td class="right">{{ number_format($document->montant_ht, 0, ',', ' ') }} Ar</td></tr>
        @if ($document->inclure_tva)
            <tr><td>TVA ({{ number_format($document->taux_tva, 2, ',', ' ') }} %)</td><td class="right">{{ number_format($vatAmount, 0, ',', ' ') }} Ar</td></tr>
        @endif
        <tr class="grand-total"><td>Total TTC</td><td class="right">{{ number_format($document->montant_ttc, 0, ',', ' ') }} Ar</td></tr>
    </table>

    @if ($document->remarque)
        <div class="notes"><strong>Remarque</strong><br>{{ $document->remarque }}</div>
    @endif

    @if ($companyCachetPath && file_exists($companyCachetPath))
        <div class="stamp">
            <p>Le responsable</p>
            <img src="{{ $companyCachetPath }}" alt="Cachet de l’entreprise">
        </div>
    @endif

    <div class="footer">Document généré depuis Softio.</div>
</body>
</html>
