#!/bin/bash

# =============================================================================
# LA VOÛTE SAVOIE - Installation Script
# Automated deployment for Ubuntu server
# =============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="lavoutesavoie.fr"
APP_DIR="/var/www/lavoutesavoie"
REPO_URL="https://github.com/jEFFzYz/LAVOUTESAVOIE.git"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🍽️  LA VOÛTE SAVOIE - Installation                          ║"
echo "║   Restaurant Gastronomique                                    ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ce script doit être exécuté en tant que root (sudo)${NC}"
    exit 1
fi

# =============================================================================
# Step 1: System Update
# =============================================================================
echo -e "\n${YELLOW}📦 Étape 1/8: Mise à jour du système...${NC}"
apt update && apt upgrade -y

# =============================================================================
# Step 2: Install Dependencies
# =============================================================================
echo -e "\n${YELLOW}📦 Étape 2/8: Installation des dépendances...${NC}"

# Install essential packages
apt install -y curl wget git ufw fail2ban

# Install Node.js 20.x LTS
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}Installing PM2...${NC}"
    npm install -g pm2
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${BLUE}Installing Nginx...${NC}"
    apt install -y nginx
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo -e "${BLUE}Installing Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"

# =============================================================================
# Step 3: Configure Firewall
# =============================================================================
echo -e "\n${YELLOW}🔒 Étape 3/8: Configuration du pare-feu...${NC}"

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${GREEN}✅ Pare-feu configuré${NC}"

# =============================================================================
# Step 4: Clone Repository
# =============================================================================
echo -e "\n${YELLOW}📥 Étape 4/8: Clonage du repository...${NC}"

# Create app directory
mkdir -p $APP_DIR

# Clone or pull repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    echo "Cloning repository..."
    git clone $REPO_URL $APP_DIR
fi

cd $APP_DIR

echo -e "${GREEN}✅ Repository cloné${NC}"

# =============================================================================
# Step 5: Install Node.js Dependencies
# =============================================================================
echo -e "\n${YELLOW}📦 Étape 5/8: Installation des dépendances Node.js...${NC}"

cd $APP_DIR/backend
npm install --production

echo -e "${GREEN}✅ Dépendances Node.js installées${NC}"

# =============================================================================
# Step 6: Configure Environment
# =============================================================================
echo -e "\n${YELLOW}⚙️  Étape 6/8: Configuration de l'environnement...${NC}"

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp $APP_DIR/config/.env.example $APP_DIR/backend/.env
    echo -e "${YELLOW}⚠️  IMPORTANT: Éditez le fichier $APP_DIR/backend/.env avec vos paramètres SMTP OVH${NC}"
fi

# Create database directory
mkdir -p $APP_DIR/database
chown -R www-data:www-data $APP_DIR/database
chmod 755 $APP_DIR/database

echo -e "${GREEN}✅ Environnement configuré${NC}"

# =============================================================================
# Step 7: Configure Nginx
# =============================================================================
echo -e "\n${YELLOW}🌐 Étape 7/8: Configuration de Nginx...${NC}"

# Copy Nginx configuration
cp $APP_DIR/config/nginx.conf /etc/nginx/sites-available/lavoutesavoie

# Create symlink
ln -sf /etc/nginx/sites-available/lavoutesavoie /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# For initial setup without SSL (will be replaced after certbot)
cat > /etc/nginx/sites-available/lavoutesavoie-temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name lavoutesavoie.fr www.lavoutesavoie.fr;

    root /var/www/lavoutesavoie/frontend;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Use temp config first
ln -sf /etc/nginx/sites-available/lavoutesavoie-temp /etc/nginx/sites-enabled/lavoutesavoie

# Reload Nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configuré${NC}"

# =============================================================================
# Step 8: Setup PM2 & Start Application
# =============================================================================
echo -e "\n${YELLOW}🚀 Étape 8/8: Démarrage de l'application...${NC}"

cd $APP_DIR/backend

# Stop existing PM2 processes
pm2 delete lavoute-api 2>/dev/null || true

# Start application with PM2
pm2 start server.js --name "lavoute-api" --env production

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✅ Application démarrée${NC}"

# =============================================================================
# SSL Certificate
# =============================================================================
echo -e "\n${YELLOW}🔐 Configuration SSL avec Let's Encrypt...${NC}"

# Create certbot webroot directory
mkdir -p /var/www/certbot

echo -e "${BLUE}Pour obtenir le certificat SSL, exécutez la commande suivante:${NC}"
echo ""
echo -e "  ${GREEN}sudo certbot --nginx -d lavoutesavoie.fr -d www.lavoutesavoie.fr${NC}"
echo ""
echo -e "${BLUE}Après l'obtention du certificat, remplacez la configuration Nginx:${NC}"
echo ""
echo -e "  ${GREEN}sudo ln -sf /etc/nginx/sites-available/lavoutesavoie /etc/nginx/sites-enabled/lavoutesavoie${NC}"
echo -e "  ${GREEN}sudo nginx -t && sudo systemctl reload nginx${NC}"

# =============================================================================
# Final Summary
# =============================================================================
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ✅ INSTALLATION TERMINÉE !                                  ║"
echo "║                                                               ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║   📁 Répertoire: /var/www/lavoutesavoie                       ║"
echo "║   🌐 URL: http://lavoutesavoie.fr (HTTPS après certbot)       ║"
echo "║   🔧 API: http://localhost:3000                               ║"
echo "║                                                               ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║   📝 PROCHAINES ÉTAPES:                                       ║"
echo "║                                                               ║"
echo "║   1. Éditez /var/www/lavoutesavoie/backend/.env               ║"
echo "║      avec vos paramètres SMTP OVH                             ║"
echo "║                                                               ║"
echo "║   2. Obtenez le certificat SSL:                               ║"
echo "║      sudo certbot --nginx -d lavoutesavoie.fr                 ║"
echo "║                                                               ║"
echo "║   3. Redémarrez l'application:                                ║"
echo "║      pm2 restart lavoute-api                                  ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Display PM2 status
echo -e "\n${BLUE}📊 Statut PM2:${NC}"
pm2 status

echo -e "\n${BLUE}📋 Commandes utiles:${NC}"
echo "  pm2 logs lavoute-api     # Voir les logs"
echo "  pm2 restart lavoute-api  # Redémarrer l'application"
echo "  pm2 stop lavoute-api     # Arrêter l'application"
echo "  pm2 monit                # Monitoring en temps réel"
