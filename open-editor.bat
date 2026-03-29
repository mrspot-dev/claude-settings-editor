@echo off
title Claude Settings Editor
cd /d "%~dp0"
python open-editor.py %*
if errorlevel 1 pause
