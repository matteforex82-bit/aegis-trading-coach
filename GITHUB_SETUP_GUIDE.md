# Guida al Setup di GitHub per AEGIS Trading Coach

Questa guida ti aiuterà a caricare il progetto AEGIS Trading Coach su GitHub in modo semplice e veloce.

## Prerequisiti

1. **Git**: Assicurati di avere Git installato sul tuo computer. Puoi scaricarlo da [git-scm.com](https://git-scm.com/downloads).

2. **GitHub CLI** (opzionale ma consigliato): Per una configurazione più semplice, è consigliabile installare GitHub CLI da [cli.github.com](https://cli.github.com/).

3. **Account GitHub**: Avrai bisogno di un account GitHub. Se non ne hai uno, puoi crearlo gratuitamente su [github.com](https://github.com/).

## Istruzioni per il Setup

### Metodo 1: Utilizzo dello Script Automatico (Consigliato)

1. Fai doppio clic sul file `setup-github.bat` nella cartella principale del progetto.

2. Segui le istruzioni visualizzate nella finestra del terminale:
   - Se richiesto, inserisci il tuo username GitHub.
   - Se utilizzi GitHub CLI, potrebbe essere necessario effettuare il login.
   - Se non hai GitHub CLI, dovrai creare manualmente un repository su GitHub e fornire l'URL quando richiesto.

3. Attendi il completamento del processo. Al termine, vedrai un messaggio di conferma con l'URL del tuo repository GitHub.

### Metodo 2: Esecuzione Manuale dello Script PowerShell

Se preferisci eseguire direttamente lo script PowerShell:

1. Apri il file `github-setup.ps1` con un editor di testo.

2. Modifica i parametri all'inizio del file:
   ```powershell
   $repoName = "aegis-trading-coach" # Modifica questo con il nome desiderato per il repository
   $githubUsername = "" # Inserisci il tuo username GitHub
   $description = "AEGIS Trading Coach - Una dashboard avanzata per il trading con coaching AI" # Descrizione del repository
   ```

3. Apri PowerShell come amministratore.

4. Naviga alla directory del progetto:
   ```powershell
   cd "percorso\alla\cartella\del\progetto"
   ```

5. Esegui lo script:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\github-setup.ps1
   ```

6. Segui le istruzioni visualizzate nel terminale.

### Metodo 3: Setup Manuale

Se preferisci configurare tutto manualmente:

1. Crea un nuovo repository su GitHub:
   - Vai su [github.com/new](https://github.com/new)
   - Inserisci un nome per il repository (es. "aegis-trading-coach")
   - Aggiungi una descrizione (opzionale)
   - Scegli se rendere il repository pubblico o privato
   - NON inizializzare il repository con README, .gitignore o licenza
   - Clicca su "Create repository"

2. Apri un terminale e naviga alla directory del progetto:
   ```bash
   cd "percorso\alla\cartella\del\progetto"
   ```

3. Inizializza il repository Git locale:
   ```bash
   git init
   ```

4. Aggiungi tutti i file al repository:
   ```bash
   git add .
   ```

5. Crea il commit iniziale:
   ```bash
   git commit -m "Commit iniziale: AEGIS Trading Coach"
   ```

6. Collega il repository locale a quello remoto:
   ```bash
   git remote add origin https://github.com/TUO_USERNAME/NOME_REPOSITORY.git
   ```

7. Esegui il push al repository remoto:
   ```bash
   git push -u origin master
   ```

## Risoluzione dei Problemi

### Errore: "fatal: remote origin already exists"

Se ricevi questo errore, significa che esiste già un remote chiamato "origin". Puoi rimuoverlo e aggiungere quello nuovo:

```bash
git remote remove origin
git remote add origin https://github.com/TUO_USERNAME/NOME_REPOSITORY.git
```

### Errore durante il push

Se riscontri problemi durante il push, potrebbe essere necessario specificare il branch principale:

```bash
git push -u origin main
```

Oppure, se il tuo branch principale è "master":

```bash
git push -u origin master
```

### Altri problemi

Per altri problemi, consulta la [documentazione ufficiale di Git](https://git-scm.com/doc) o la [documentazione di GitHub](https://docs.github.com/).

## Dopo il Setup

Una volta completato il setup, il tuo progetto sarà disponibile su GitHub. Potrai accedervi tramite l'URL:

```
https://github.com/TUO_USERNAME/NOME_REPOSITORY
```

Da qui potrai:
- Gestire il codice sorgente
- Collaborare con altri sviluppatori
- Tenere traccia delle modifiche
- Creare release
- E molto altro!