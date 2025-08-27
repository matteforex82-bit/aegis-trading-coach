# Script per automatizzare il push su GitHub

# Parametri da configurare
$repoName = "aegis-trading-coach" # Modifica questo con il nome desiderato per il repository
$githubUsername = "" # Inserisci il tuo username GitHub
$description = "AEGIS Trading Coach - Una dashboard avanzata per il trading con coaching AI" # Descrizione del repository

# Verifica se git è installato
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git non è installato. Per favore installa Git da https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}

# Verifica se gh CLI è installato
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "GitHub CLI non è installato. Ti consigliamo di installarlo per una configurazione più semplice." -ForegroundColor Yellow
    Write-Host "Puoi installarlo da: https://cli.github.com/" -ForegroundColor Yellow
    
    # Chiedi all'utente se vuole procedere manualmente
    $proceed = Read-Host "Vuoi procedere con la configurazione manuale? (s/n)"
    if ($proceed -ne "s") {
        exit 1
    }
}

# Chiedi username se non configurato
if ([string]::IsNullOrEmpty($githubUsername)) {
    $githubUsername = Read-Host "Inserisci il tuo username GitHub"
}

# Inizializza Git nel progetto locale
Write-Host "Inizializzazione del repository Git locale..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
git init

# Crea .gitignore se non esiste
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creazione del file .gitignore..." -ForegroundColor Cyan
    @"
# dependencies
node_modules/
.pnp/
.pnp.js

# testing
coverage/

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
"@ | Out-File -FilePath ".gitignore" -Encoding utf8
}

# Crea il repository su GitHub
Write-Host "Creazione del repository su GitHub..." -ForegroundColor Cyan

if ($ghInstalled) {
    # Usa GitHub CLI se installato
    gh auth status -h github.com
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Effettua il login su GitHub..." -ForegroundColor Cyan
        gh auth login
    }
    
    # Crea il repository
    gh repo create $repoName --private --description "$description" --source=. --remote=origin
} else {
    # Metodo manuale
    Write-Host "Per favore, crea manualmente un nuovo repository su GitHub:" -ForegroundColor Yellow
    Write-Host "1. Vai su https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Nome repository: $repoName" -ForegroundColor Yellow
    Write-Host "3. Descrizione: $description" -ForegroundColor Yellow
    Write-Host "4. Scegli 'Private' se desideri un repository privato" -ForegroundColor Yellow
    Write-Host "5. NON inizializzare il repository con README, .gitignore o licenza" -ForegroundColor Yellow
    Write-Host "6. Clicca 'Create repository'" -ForegroundColor Yellow
    
    $repoUrl = Read-Host "Inserisci l'URL del repository appena creato (es. https://github.com/$githubUsername/$repoName.git)"
    
    # Aggiungi il remote
    git remote add origin $repoUrl
}

# Aggiungi tutti i file
Write-Host "Aggiunta dei file al repository..." -ForegroundColor Cyan
git add .

# Commit iniziale
Write-Host "Creazione del commit iniziale..." -ForegroundColor Cyan
git commit -m "Commit iniziale: AEGIS Trading Coach"

# Push al repository remoto
Write-Host "Push al repository remoto..." -ForegroundColor Cyan
git push -u origin master

# Verifica se il push è andato a buon fine
if ($LASTEXITCODE -eq 0) {
    Write-Host "\nSuccesso! Il progetto è stato caricato su GitHub." -ForegroundColor Green
    
    if ($ghInstalled) {
        $repoUrl = "https://github.com/$githubUsername/$repoName"
    }
    
    Write-Host "URL del repository: $repoUrl" -ForegroundColor Green
} else {
    Write-Host "\nSi è verificato un errore durante il push. Controlla i messaggi di errore sopra." -ForegroundColor Red
}