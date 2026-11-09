<!doctype html>
<html lang="fr">
<body>
    <p>Bonjour {{ $recipientName ?: 'Madame, Monsieur' }},</p>
    <p style="white-space: pre-wrap">{{ $body }}</p>
    <p>Cordialement,<br>{{ config('mail.from.name') }}</p>
</body>
</html>
