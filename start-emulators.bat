@echo off
rem Starts the local Firebase emulators (Auth + Firestore) for Weight4All.
rem Data is kept in .firebase-emulator-data and saved when you stop with Ctrl+C.
cd /d "%~dp0"
title Weight4All - Firebase emulators

echo.
echo  Local test account (emulator only):
echo    Email:    prova.locale@weight4all.test
echo    Password: prova-locale-2026
echo.
echo  Stop with Ctrl+C (answer N to "Terminate batch job") so the data is saved.
echo.

rem Makes sure the test account exists once the emulator is up.
start "" /b node scripts\ensure-test-account.mjs

call npm run emulators
