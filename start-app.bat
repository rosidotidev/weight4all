@echo off
rem Starts the Weight4All app (dev server) and opens it in the browser.
rem Start start-emulators.bat first so login and registration work.
cd /d "%~dp0"
title Weight4All - app

echo.
echo  App: http://localhost:4200
echo  Local test account (emulator only):
echo    Email:    prova.locale@weight4all.test
echo    Password: prova-locale-2026
echo.
echo  Stop with Ctrl+C.
echo.

call npm start -- --open
