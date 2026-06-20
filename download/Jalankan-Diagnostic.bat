@echo off
title PC Diagnostic Pro - Data Collector
color 0A
echo.
echo ================================================================
echo   PC Diagnostic Pro - Data Collector
echo   Menjalankan script pengumpul data diagnostik...
echo ================================================================
echo.
echo  [INFO] Jika muncul peringatan merah, abaikan saja.
echo  [INFO] Script ini AMAN dan tidak mengubah apapun di komputer.
echo  [INFO] Proses akan memakan waktu 30-60 detik.
echo.
echo ================================================================
echo.

REM Jalankan PowerShell dengan ExecutionPolicy Bypass agar script tidak diblokir
PowerShell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0PC-Diagnostic-Collector.ps1"

echo.
echo ================================================================
echo.
echo   Script selesai.
echo.
pause
