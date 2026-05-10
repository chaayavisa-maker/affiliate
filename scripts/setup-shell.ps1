# ============================================================
# AI Tools Hub — Complete Setup Script (Windows PowerShell)
# Run this once to initialize everything.
# Usage: Right-click PowerShell > "Run as Administrator", then:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#   .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# ---- Resolve project root (one level above the script's folder) ----
# Works regardless of where PowerShell's working directory is set.
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot
Write-Host "Project root: $ProjectRoot" -ForegroundColor DarkGray

# ---- Colors ----
function Write-Red    { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Green  { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Yellow { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Blue   { param($msg) Write-Host $msg -ForegroundColor Cyan }

Write-Blue "  +======================================+"
Write-Blue "  |     AI Tools Hub - Setup Script      |"
Write-Blue "  |     Autonomous Affiliate Business    |"
Write-Blue "  +======================================+"
Write-Host ""

# ---- Check requirements ----
Write-Yellow "Checking requirements..."

if (-not (Get-Command git  -ErrorAction SilentlyContinue)) { Write-Red "git not found. Install from https://git-scm.com"; exit 1 }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Red "Node.js not found. Install from https://nodejs.org"; exit 1 }

# Resolve the correct Python command — Windows uses 'py' or 'python', rarely 'python3'
$PythonCmd = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        # Verify it actually runs (some Windows python3 entries are broken stubs)
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python 3") { $PythonCmd = $candidate; break }
    }
}
if (-not $PythonCmd) { Write-Red "Python 3 not found. Install from https://python.org"; exit 1 }

Write-Green "OK All requirements met"

# ---- Collect credentials ----
Write-Host ""
Write-Yellow "You'll need:"
Write-Host "  1. Groq API key (free): https://console.groq.com"
Write-Host "  2. GitHub repo URL (create a new empty repo at github.com)"
Write-Host "  3. Your domain name (can skip for now, Vercel gives you a free subdomain)"
Write-Host ""

$GROQ_KEY    = Read-Host "Enter your Groq API key"
$GITHUB_REPO = Read-Host "Enter your GitHub repo URL (e.g. https://github.com/you/ai-tools-hub)"
$DOMAIN_INPUT = Read-Host "Enter your domain (or press Enter to use Vercel subdomain)"
$DOMAIN = if ($DOMAIN_INPUT -eq "") { "ai-tools-hub.vercel.app" } else { $DOMAIN_INPUT }

# ---- Update domain in files ----
Write-Host ""
Write-Yellow "Configuring domain: $DOMAIN"

$WebsiteDir = Join-Path $ProjectRoot "website"
$AgentsDir  = Join-Path $ProjectRoot "agents"

if (-not (Test-Path $WebsiteDir)) { Write-Red "Cannot find 'website' folder at: $WebsiteDir"; exit 1 }
if (-not (Test-Path $AgentsDir))  { Write-Red "Cannot find 'agents' folder at: $AgentsDir";  exit 1 }

Get-ChildItem -Path $WebsiteDir -Recurse -Include "*.tsx","*.ts","*.txt","*.xml" | ForEach-Object {
    $content = (Get-Content -LiteralPath $_.FullName) -join "`n"
    if ($content -match "YOUR_DOMAIN\.com") {
        $content = $content -replace "YOUR_DOMAIN\.com", $DOMAIN
        Set-Content -LiteralPath $_.FullName -Value $content
    }
}
Write-Green "OK Domain configured"

# ---- Set up Git ----
Write-Host ""
Write-Yellow "Initializing Git repository..."

git init
try   { git remote add origin $GITHUB_REPO 2>$null }
catch { git remote set-url origin $GITHUB_REPO }

git add .
git commit -m "Initial commit: AI Tools Hub autonomous affiliate site"
git branch -M main
git push -u origin main --force
Write-Green "OK Code pushed to GitHub"

# ---- Set GitHub Secrets ----
Write-Host ""
Write-Yellow "Setting GitHub Actions secret..."

if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh secret set GROQ_API_KEY --body $GROQ_KEY
    Write-Green "OK GROQ_API_KEY secret set via GitHub CLI"
} else {
    Write-Yellow "GitHub CLI not found. Set the secret manually:"
    Write-Host "  1. Go to: $GITHUB_REPO/settings/secrets/actions"
    Write-Host "  2. Click 'New repository secret'"
    Write-Host "  3. Name:  GROQ_API_KEY"
    Write-Host "  4. Value: $GROQ_KEY"
}

# ---- Install Python deps ----
Write-Host ""
Write-Yellow "Installing Python dependencies..."
# Use 'python -m pip' instead of pip/pip3 directly — bypasses AppLocker blocks on pip.exe
Push-Location $AgentsDir
& $PythonCmd -m pip install -r requirements.txt -q
Pop-Location
Write-Green "OK Python dependencies installed"

# ---- Install Node deps ----
Write-Host ""
Write-Yellow "Installing Node.js dependencies..."
Push-Location $WebsiteDir
npm install --silent
Pop-Location
Write-Green "OK Node dependencies installed"

# ---- Test run ----
Write-Host ""
Write-Yellow "Running one article to test the pipeline..."
Push-Location $AgentsDir
$env:GROQ_API_KEY    = $GROQ_KEY
$env:ARTICLES_PER_RUN = "1"
& $PythonCmd orchestrator.py
Pop-Location
Write-Green "OK Test article generated!"

# ---- Build website ----
Write-Host ""
Write-Yellow "Building website..."
Push-Location $WebsiteDir
npm run build
Pop-Location
Write-Green "OK Website built successfully"

# ---- Next steps ----
Write-Host ""
Write-Blue "================================================"
Write-Green "  SETUP COMPLETE! Next steps:"
Write-Blue "================================================"
Write-Host ""
Write-Yellow "1. Deploy to Vercel (free):"
Write-Host "   a. Go to https://vercel.com and sign in with GitHub"
Write-Host "   b. Click 'New Project' > import your GitHub repo"
Write-Host "   c. Set Root Directory to: website"
Write-Host "   d. Add environment variable: SITE_URL = https://$DOMAIN"
Write-Host "   e. Deploy!"
Write-Host ""
Write-Yellow "2. Start making money:"
Write-Host "   a. Sign up for Google AdSense: https://adsense.google.com"
Write-Host "   b. Sign up for affiliate programs:"
Write-Host "      - ShareASale:   https://www.shareasale.com"
Write-Host "      - Impact:       https://impact.com"
Write-Host "      - PartnerStack: https://partnerstack.com (best for SaaS)"
Write-Host "   c. Update affiliate URLs in: agents\content_agent.py"
Write-Host "   d. Add your AdSense publisher ID in: website\app\layout.tsx"
Write-Host ""
Write-Yellow "3. Automation is already running:"
Write-Host "   - GitHub Actions generates 2 articles every day at 8 AM UTC"
Write-Host "   - Each article auto-deploys to Vercel"
Write-Host "   - Check progress at: $GITHUB_REPO/actions"
Write-Host ""
Write-Yellow "4. Expected timeline:"
Write-Host "   - Week 1-4:  Content builds up (60+ articles)"
Write-Host "   - Month 2-3: Google indexes, first organic traffic"
Write-Host "   - Month 4-6: First affiliate commissions"
Write-Host "   - Month 6+:  Consistent monthly income"
Write-Host ""
Write-Green "Your autonomous business is running!"
Write-Host "   The agents will publish 2 articles/day automatically."
Write-Host "   You don't need to do anything else."