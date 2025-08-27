# Script per risolvere il problema "remote origin already exists"

# Parametri
$repoUrl = "https://github.com/matteforex82-bit/aegis-trading-coach.git"

Write-Host "Risoluzione del problema 'remote origin already exists'..." -ForegroundColor Cyan

# Rimuovi il remote origin esistente
Write-Host "Rimozione del remote origin esistente..." -ForegroundColor Yellow
git remote remove origin

# Aggiungi il nuovo remote origin
Write-Host "Aggiunta del nuovo remote origin: $repoUrl" -ForegroundColor Yellow
git remote add origin $repoUrl

# Verifica che il remote sia stato aggiunto correttamente
Write-Host "\nVerifica dei remote configurati:" -ForegroundColor Cyan
git remote -v

# Crea il commit iniziale se non esiste già
$hasCommits = git log -n 1 2>$null
if (-not $hasCommits) {
    Write-Host "\nCreazione del commit iniziale..." -ForegroundColor Cyan
    git add .
    git commit -m "Commit iniziale: AEGIS Trading Coach"
}

# Push al repository remoto
Write-Host "\nPush al repository remoto..." -ForegroundColor Cyan
git push -u origin master

# Se il push fallisce con il branch master, prova con main
if ($LASTEXITCODE -ne 0) {
    Write-Host "\nIl push al branch 'master' è fallito, provo con 'main'..." -ForegroundColor Yellow
    git push -u origin main
}

# Verifica se il push è andato a buon fine
if ($LASTEXITCODE -eq 0) {
    Write-Host "\nSuccesso! Il progetto è stato caricato su GitHub." -ForegroundColor Green
    Write-Host "URL del repository: $repoUrl" -ForegroundColor Green
} else {
    Write-Host "\nSi è verificato un errore durante il push. Prova questi comandi manualmente:" -ForegroundColor Red
    Write-Host "git branch" -ForegroundColor Yellow
    Write-Host "git push -u origin NOME_DEL_TUO_BRANCH" -ForegroundColor Yellow
}