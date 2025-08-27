@echo off
echo Risoluzione del problema "remote origin already exists"
echo =====================================================

powershell.exe -ExecutionPolicy Bypass -File "%~dp0fix-github-remote.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Configurazione completata con successo!
    echo Premi un tasto per chiudere questa finestra...
) else (
    echo.
    echo Si è verificato un errore durante la configurazione.
    echo Controlla i messaggi di errore sopra.
    echo Premi un tasto per chiudere questa finestra...
)

pause > nul