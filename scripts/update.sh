#!/bin/bash

# =============================================================================
# LA VOÛTE SAVOIE - Update Script
# Quick update from GitHub
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/lavoutesavoie"

echo -e "${BLUE}🔄 Mise à jour de La Voûte Savoie...${NC}"

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo -e "${YELLOW}📥 Pull des dernières modifications...${NC}"
git pull origin main

# Install any new dependencies
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"
cd $APP_DIR/backend
npm install --production

# Restart application
echo -e "${YELLOW}🔄 Redémarrage de l'application...${NC}"
pm2 restart lavoute-api

echo -e "${GREEN}✅ Mise à jour terminée !${NC}"
pm2 status
