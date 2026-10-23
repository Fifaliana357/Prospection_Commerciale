# Softio CRM - Backend Laravel

Backend RESTful API complet développé avec Laravel pour l'application de prospection et CRM **Softio**.

---

## 🛠️ Stack Technique

- **Framework** : Laravel 11 / 12
- **PHP** : 8.3+
- **Base de données** : MySQL / MariaDB (WAMP Server port 3306)
- **Authentification** : Laravel Sanctum (Tokens Bearer)
- **CORS** : Configuré pour autoriser le frontend Vite / React (`http://localhost:5173`)

---

## 🚀 Démarrage Rapide

### 1. Configuration de l'environnement (`.env`)

Assurez-vous que WAMP Server est lancé (icône verte, MySQL actif sur le port 3306).

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=softio_db
DB_USERNAME=root
DB_PASSWORD=
```

### 2. Migrations et Données Initiales (Seeders)

Pour réinitialiser et remplir la base avec toutes les données réalistes :

```bash
php artisan migrate:fresh --seed
```

### 3. Lancer le Serveur API

```bash
php artisan serve --port=8000
```

L'API sera disponible sur : **`http://127.0.0.1:8000/api`**

---

## 🔑 Identifiants Démo (Admin)

- **Email** : `admin@softio.mg`
- **Mot de passe** : `password123`

---

## 📡 Endpoints de l'API REST

### 🔐 Authentification (`/api/auth`)
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Inscription d'un utilisateur |
| `POST` | `/api/auth/login` | Connexion & obtention du Bearer token |
| `GET` | `/api/auth/me` | Profil utilisateur connecté (Sanctum) |
| `POST` | `/api/auth/logout` | Révocation du token (Sanctum) |

### 👥 Prospects (`/api/prospects`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/prospects` | Liste des prospects (filtres: `search`, `type`, `classification`) |
| `POST` | `/api/prospects` | Création d'un prospect (matricule auto `P-xxxx`) |
| `GET` | `/api/prospects/{id}` | Détail d'un prospect |
| `PUT` | `/api/prospects/{id}` | Modification d'un prospect |
| `DELETE` | `/api/prospects/{id}` | Suppression d'un prospect |

### 📞 Prospections (`/api/prospections`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/prospections`

### 📅 Rendez-vous (`/api/rendez-vous`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/rendez-vous`

### 💼 Ventes (`/api/ventes`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/ventes`

### 🧾 Facturation (`/api/factures`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/factures`

### 📦 Catalogue Produits & Services (`/api/catalogue`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/catalogue`

### 📊 Stock & Mouvements (`/api/stock`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/stock/mouvements` | Historique des entrées / sorties |
| `GET` | `/api/stock/inventaire` | État actuel des stocks et alertes |
| `POST` | `/api/stock/mouvements` | Enregistrer une entrée / sortie et maj stock |

### 🛠️ SAV & Tickets (`/api/sav-tickets`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/sav-tickets`

### 👔 Commerciaux (`/api/commerciaux`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/commerciaux`

### ⭐ Intérêts Clients (`/api/interets`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/interets`

### 🤝 Closings (`/api/closings`)
- `GET`, `POST`, `PUT`, `DELETE` sur `/api/closings`

### 📁 Bibliothèque de Documents (`/api/bibliotheque`)
- `GET`, `POST`, `DELETE` sur `/api/bibliotheque`

### 📈 Tableau de bord & KPIs (`/api/dashboard`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Métriques agrégées (prospects, CA, RDV, activités) |
