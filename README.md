# 🍽️ La Voûte Savoie

**Site web de restaurant gastronomique avec système de réservation**

Un site moderne et élégant pour le restaurant gastronomique La Voûte Savoie, avec un système complet de gestion des réservations.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Nginx](https://img.shields.io/badge/Nginx-Latest-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Fonctionnalités

### Frontend
- 🎨 Design élégant sombre avec accents dorés
- 📱 Responsive design (mobile, tablette, desktop)
- ⚡ Performance optimisée (lazy loading, compression)
- 🔍 SEO complet (meta tags, Schema.org, sitemap)
- ♿ Accessibilité (ARIA, navigation clavier)

### Backend
- 📅 Système de réservation intelligent
- 📧 Envoi d'emails via SMTP OVH
- 🪑 Gestion automatique des tables (20 tables configurées)
- 🔒 API sécurisée avec rate limiting
- 📊 Dashboard admin pour gérer les réservations

### Infrastructure
- 🌐 Configuration Nginx production-ready
- 🔐 SSL/TLS avec Let's Encrypt
- 🚀 Déploiement automatisé (PM2)
- 🛡️ Protection DDoS et sécurité renforcée

---

## 📁 Structure du projet

```
LAVOUTESAVOIE/
├── frontend/                 # Site web statique
│   ├── index.html           # Page principale
│   ├── mentions-legales.html
│   ├── confidentialite.html
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── css/
│   │   └── style.css        # Styles (variables CSS, responsive)
│   ├── js/
│   │   └── app.js           # JavaScript (navigation, formulaires)
│   └── assets/
│       └── images/          # Images du site
│
├── backend/                  # API Node.js
│   ├── server.js            # Point d'entrée
│   ├── package.json
│   ├── routes/
│   │   ├── reservations.js  # API réservations
│   │   ├── availability.js  # API disponibilités
│   │   └── admin.js         # API administration
│   └── services/
│       ├── reservationService.js  # Logique métier
│       └── emailService.js        # Envoi d'emails
│
├── config/
│   ├── nginx.conf           # Configuration Nginx
│   └── .env.example         # Variables d'environnement
│
├── database/                 # Stockage JSON
│   ├── reservations.json
│   └── config.json
│
└── scripts/
    ├── install.sh           # Installation automatique
    └── update.sh            # Mise à jour rapide
```

---

## 🚀 Installation

### Prérequis
- VPS Ubuntu 20.04+ avec accès root
- Nom de domaine pointant vers le serveur
- Accès SMTP OVH (email hébergé)

### Installation automatique

```bash
# 1. Connexion SSH au serveur
ssh root@votre-serveur

# 2. Cloner le repository
git clone https://github.com/jEFFzYz/LAVOUTESAVOIE.git /var/www/lavoutesavoie

# 3. Rendre le script exécutable et lancer l'installation
chmod +x /var/www/lavoutesavoie/scripts/install.sh
sudo /var/www/lavoutesavoie/scripts/install.sh
```

### Configuration post-installation

#### 1. Configurer les variables d'environnement
```bash
nano /var/www/lavoutesavoie/backend/.env
```

Remplir avec vos informations :
```env
NODE_ENV=production
PORT=3000

# OVH SMTP
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_USER=contact@lavoutesavoie.fr
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=contact@lavoutesavoie.fr
RESTAURANT_EMAIL=contact@lavoutesavoie.fr

# Admin (générer avec: openssl rand -hex 32)
ADMIN_API_KEY=votre_cle_api_securisee
```

#### 2. Obtenir le certificat SSL
```bash
sudo certbot --nginx -d lavoutesavoie.fr -d www.lavoutesavoie.fr
```

#### 3. Activer la configuration Nginx finale
```bash
sudo ln -sf /etc/nginx/sites-available/lavoutesavoie /etc/nginx/sites-enabled/lavoutesavoie
sudo nginx -t && sudo systemctl reload nginx
```

#### 4. Redémarrer l'application
```bash
pm2 restart lavoute-api
```

---

## 📧 Configuration SMTP OVH

Pour utiliser l'envoi d'emails avec OVH :

| Paramètre | Valeur |
|-----------|--------|
| Serveur SMTP | `ssl0.ovh.net` |
| Port | `465` (SSL) ou `587` (STARTTLS) |
| Sécurité | SSL/TLS |
| Authentification | Votre email complet |

---

## 🔧 Commandes utiles

```bash
# Statut de l'application
pm2 status

# Voir les logs
pm2 logs lavoute-api

# Redémarrer
pm2 restart lavoute-api

# Monitoring en temps réel
pm2 monit

# Mise à jour depuis GitHub
cd /var/www/lavoutesavoie && sudo ./scripts/update.sh
```

---

## 📡 API Endpoints

### Publics
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/reservations` | Créer une réservation |
| `GET` | `/api/reservations/:id` | Statut d'une réservation |
| `GET` | `/api/availability?date=YYYY-MM-DD` | Disponibilités |
| `GET` | `/api/health` | Health check |

### Admin (requiert `X-API-Key` header)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/admin/reservations` | Liste des réservations |
| `PUT` | `/api/admin/reservations/:id/confirm` | Confirmer |
| `PUT` | `/api/admin/reservations/:id/cancel` | Annuler |
| `GET` | `/api/admin/stats` | Statistiques |
| `GET` | `/api/admin/dashboard/:date` | Dashboard du jour |

---

## 🪑 Configuration des tables

Le restaurant est configuré avec 20 tables par défaut :

| Tables | Capacité | Quantité |
|--------|----------|----------|
| 1-3, 13, 16, 20 | 2 personnes | 6 tables |
| 4-7, 14-15, 17, 19 | 4 personnes | 8 tables |
| 8-10, 18 | 6 personnes | 4 tables |
| 11-12 | 8 personnes | 2 tables |

**Capacité totale : ~80 couverts**

Pour modifier, éditez `/var/www/lavoutesavoie/database/config.json`

---

## 🔒 Sécurité

- ✅ HTTPS obligatoire (SSL/TLS)
- ✅ Headers de sécurité (HSTS, CSP, X-Frame-Options)
- ✅ Rate limiting API (10 req/s)
- ✅ Rate limiting réservations (10/heure/IP)
- ✅ Validation des entrées côté serveur
- ✅ Protection XSS et injection
- ✅ Pare-feu UFW configuré

---

## 📝 Personnalisation

### Modifier le contenu
- **Textes** : Éditez `frontend/index.html`
- **Styles** : Modifiez les variables CSS dans `frontend/css/style.css`
- **Menu** : Mettez à jour la section `#menu` dans `index.html`

### Ajouter des images
Placez vos images dans `frontend/assets/images/` :
- `hero-bg.jpg` - Image de fond hero (1920x1080 min)
- `chef-portrait.jpg` - Photo du chef
- `gallery/` - Photos des plats

---

## 🐛 Dépannage

### L'application ne démarre pas
```bash
pm2 logs lavoute-api --lines 50
```

### Emails non envoyés
1. Vérifiez les identifiants SMTP dans `.env`
2. Testez la connexion :
```bash
cd /var/www/lavoutesavoie/backend
node -e "require('./services/emailService').testConnection()"
```

### Erreur Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE)

---

## 👨‍💻 Développé par

**SYNOVIZION** - Solutions web sur mesure

---

*La Voûte Savoie - Restaurant Gastronomique à Moûtiers*
