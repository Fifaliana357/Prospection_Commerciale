<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;background:#f4f6f7;color:#24313a;font-family:Arial,sans-serif;line-height:1.6">
    <div style="max-width:620px;margin:24px auto;padding:28px;background:#fff;border:1px solid #e3e8eb;border-radius:12px">
        <p>{{ $clientName ? 'Bonjour ' . $clientName . ',' : 'Bonjour,' }}</p>
        <p>Veuillez trouver en pièce jointe votre {{ strtolower($typeLabel) }} n° <strong>{{ $document->numero }}</strong> au format PDF.</p>
        <p>Nous vous remercions de votre confiance et restons à votre disposition pour toute question.</p>
        <p style="margin-bottom:0">Cordialement,<br>{{ $companyName }}</p>
    </div>
</body>
</html>
