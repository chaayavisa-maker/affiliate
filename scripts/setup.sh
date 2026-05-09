#!/bin/bash
# ============================================================
# AI Tools Hub — Complete Setup Script
# Run this once to initialize everything.
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║     AI Tools Hub — Setup Script      ║"
echo "  ║     Autonomous Affiliate Business    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ---- Check requirements ----
echo -e "${YELLOW}Checking requirements...${NC}"
command -v git  >/dev/null || { echo -e "${RED}git not found. Install git first.${NC}"; exit 1; }
command -v node >/dev/null || { echo -e "${RED}Node.js not found. Install from nodejs.org${NC}"; exit 1; }
command -v python3 >/dev/null || { echo -e "${RED}Python 3 not found. Install from python.org${NC}"; exit 1; }
echo -e "${GREEN}✓ All requirements met${NC}"

# ---- Collect credentials ----
echo ""
echo -e "${YELLOW}You'll need:${NC}"
echo "  1. Groq API key (free): https://console.groq.com"
echo "  2. GitHub repo URL (create a new empty repo at github.com)"
echo "  3. Your domain name (can skip for now, Vercel gives you a free subdomain)"
echo ""

read -p "Enter your Groq API key: " GROQ_KEY
read -p "Enter your GitHub repo URL (e.g. https://github.com/you/ai-tools-hub): " GITHUB_REPO
read -p "Enter your domain (or press Enter to use Vercel subdomain): " DOMAIN

DOMAIN=${DOMAIN:-"ai-tools-hub.vercel.app"}

# ---- Update domain in files ----
echo -e "\n${YELLOW}Configuring domain: ${DOMAIN}${NC}"
find website -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.txt" -o -name "*.xml" \) \
  -exec sed -i "s/YOUR_DOMAIN.com/${DOMAIN}/g" {} \;
echo -e "${GREEN}✓ Domain configured${NC}"

# ---- Set up Git ----
echo -e "\n${YELLOW}Initializing Git repository...${NC}"
git init
git remote add origin "$GITHUB_REPO" 2>/dev/null || git remote set-url origin "$GITHUB_REPO"
git add .
git commit -m "Initial commit: AI Tools Hub autonomous affiliate site"
git branch -M main
git push -u origin main
echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

# ---- Set GitHub Secrets ----
echo -e "\n${YELLOW}Setting GitHub Actions secret...${NC}"
if command -v gh >/dev/null; then
  gh secret set GROQ_API_KEY --body "$GROQ_KEY"
  echo -e "${GREEN}✓ GROQ_API_KEY secret set via GitHub CLI${NC}"
else
  echo -e "${YELLOW}GitHub CLI not found. Set the secret manually:${NC}"
  echo "  1. Go to: ${GITHUB_REPO}/settings/secrets/actions"
  echo "  2. Click 'New repository secret'"
  echo "  3. Name: GROQ_API_KEY"
  echo "  4. Value: $GROQ_KEY"
fi

# ---- Install Python deps ----
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
cd agents
pip3 install -r requirements.txt -q
cd ..
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# ---- Install Node deps ----
echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
cd website
npm install --silent
cd ..
echo -e "${GREEN}✓ Node dependencies installed${NC}"

# ---- Test run ----
echo -e "\n${YELLOW}Running one article to test the pipeline...${NC}"
cd agents
GROQ_API_KEY="$GROQ_KEY" ARTICLES_PER_RUN=1 python3 orchestrator.py
cd ..
echo -e "${GREEN}✓ Test article generated!${NC}"

# ---- Build website ----
echo -e "\n${YELLOW}Building website...${NC}"
cd website
npm run build
cd ..
echo -e "${GREEN}✓ Website built successfully${NC}"

# ---- Vercel deploy instructions ----
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}  SETUP COMPLETE! Next steps:${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}1. Deploy to Vercel (free):${NC}"
echo "   a. Go to https://vercel.com and sign in with GitHub"
echo "   b. Click 'New Project' → import your GitHub repo"
echo "   c. Set Root Directory to: website"
echo "   d. Add environment variable: SITE_URL = https://${DOMAIN}"
echo "   e. Deploy!"
echo ""
echo -e "${YELLOW}2. Start making money:${NC}"
echo "   a. Sign up for Google AdSense: https://adsense.google.com"
echo "   b. Sign up for affiliate programs:"
echo "      - ShareASale: https://www.shareasale.com"
echo "      - Impact: https://impact.com"
echo "      - PartnerStack: https://partnerstack.com (best for SaaS)"
echo "   c. Update affiliate URLs in: agents/content_agent.py"
echo "   d. Add your AdSense publisher ID in: website/app/layout.tsx"
echo ""
echo -e "${YELLOW}3. Automation is already running:${NC}"
echo "   - GitHub Actions generates 2 articles every day at 8 AM UTC"
echo "   - Each article auto-deploys to Vercel"
echo "   - Check progress at: ${GITHUB_REPO}/actions"
echo ""
echo -e "${YELLOW}4. Expected timeline:${NC}"
echo "   - Week 1-4: Content builds up (60+ articles)"
echo "   - Month 2-3: Google indexes, first organic traffic"
echo "   - Month 4-6: First affiliate commissions"
echo "   - Month 6+: Consistent monthly income"
echo ""
echo -e "${GREEN}🚀 Your autonomous business is running!${NC}"
echo -e "   The agents will publish 2 articles/day automatically."
echo -e "   You don't need to do anything else."
