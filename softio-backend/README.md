<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Local setup

The PHP GD extension must be enabled for PDF generation. On Windows, enable
`extension=gd` in the `php.ini` used by the Laravel server, then restart it.

## Connexion depuis Softio principal

La prospection peut rester accessible avec ses comptes locaux et accepter aussi
les utilisateurs qui ouvrent le module depuis Softio. Pour les domaines de
production actuels, configurer l’application du module dans Softio à
`https://prospectioncom.tuto-info.com/sso`. Softio ajoutera le code temporaire à
cette URL et le navigateur arrivera sur `/sso?code=<code-temporaire>`. Le code
est échangé par le backend Prospection avec l’API de Softio ; le secret partagé
reste exclusivement dans les `.env` des serveurs.

Configurer les variables suivantes dans le `.env` du backend Prospection :

- `SOFTIO_API_URL=https://softio-module-back.tuto-info.com/api`.
- `SOFTIO_SSO_SECRET` : même valeur que `SSO_SECRET` dans le `.env` de Softio principal.
- `SOFTIO_MODULE_ID` : identifiant du module Prospection dans Softio.
- `SOFTIO_SSO_VERIFY_MINUTES` : fréquence de revalidation de l’abonnement (10 minutes par défaut).
- `FRONTEND_URL=https://prospectioncom.tuto-info.com` : origine autorisée par le CORS.

Le contrat serveur-à-serveur attendu est le même que celui utilisé par le module
Comptabilité : `POST /sso/echanger` et `POST /sso/verifier`, avec l’en-tête
`X-Sso-Secret`. L’échange renvoie `utilisateur` (`id`, `email`, `nom`, `prenom`),
`organisation` (`id`, `nom`, `email`), `module.id` et `acces.actif`. La
vérification reçoit `user_id` et `module_id` et renvoie `acces.actif`.

Le propriétaire de l’organisation (même identifiant utilisateur et organisation)
est rattaché à un compte Admin ; les autres membres deviennent des Commerciaux
dans la même organisation. Les comptes locaux existants ne sont jamais repris
automatiquement sur la seule base de leur adresse e-mail.
Le nom commercial et le téléphone renseignés sur le compte propriétaire Softio
sont transmis à la première connexion et synchronisés avec les informations
d’entreprise de Prospection. La visite guidée est activée lors du premier
rattachement de l’entreprise.

Configurer `VITE_SOFTIO_URL` dans le frontend pour que la déconnexion des comptes
arrivés par SSO retourne au tableau de bord Softio. Le frontend appelle l’API
prospection avec `VITE_API_URL`. En production, utiliser
`VITE_SOFTIO_URL=https://softio-module.tuto-info.com` et l’URL HTTPS de l’API
Prospection pour `VITE_API_URL`.

Exécuter `php artisan migrate` après le déploiement pour ajouter les identifiants
Softio aux comptes Admin et Commercial. Les abonnements inactifs bloquent les
requêtes authentifiées après la période de cache configurée. Si Softio est
temporairement injoignable lors d’une revalidation, les comptes déjà connectés
restent accessibles et la vérification sera retentée à la requête suivante.

## Prospection e-mail

Outgoing prospection messages with type **Email** use Laravel's configured mail
transport. Set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, and `MAIL_FROM_NAME` in the backend
environment. For Gmail or Google Workspace, use `smtp.gmail.com`, port `587`,
TLS, and a Google App Password; keep the sender address aligned with the
authenticated mailbox.

Automatic reply import uses Gmail IMAP. Enable IMAP for the mailbox, create an
App Password with 2-Step Verification enabled, and set
`PROSPECTION_IMAP_ENABLED=true`, `PROSPECTION_IMAP_USERNAME`, and
`PROSPECTION_IMAP_PASSWORD`. Keep the credentials in the server `.env`, never
in frontend code. Replies are matched by email thread first, then by sender
only when there is exactly one active prospection for that client. Unmatched
messages are flagged in Gmail for manual review. Manual incoming messages
remain available in the prospection history.

Run `php artisan migrate` when deploying the message tracking fields. To import
new replies automatically, configure the server cron to run Laravel's scheduler
every minute:

```cron
* * * * * cd /path/to/softio-backend && php artisan schedule:run >> /dev/null 2>&1
```

The first successful sync records the current inbox UID as a baseline and does
not import older mail. Later messages are imported once even if they have
already been opened in Gmail.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains over 2000 video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the Laravel [Patreon page](https://patreon.com/taylorotwell).

### Premium Partners

- **[Vehikl](https://vehikl.com/)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Cubet Techno Labs](https://cubettech.com)**
- **[Cyber-Duck](https://cyber-duck.co.uk)**
- **[Many](https://www.many.co.uk)**
- **[Webdock, Fast VPS Hosting](https://www.webdock.io/en)**
- **[DevSquad](https://devsquad.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel/)**
- **[OP.GG](https://op.gg)**
- **[WebReinvent](https://webreinvent.com/?utm_source=laravel&utm_medium=github&utm_campaign=patreon-sponsors)**
- **[Lendio](https://lendio.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
