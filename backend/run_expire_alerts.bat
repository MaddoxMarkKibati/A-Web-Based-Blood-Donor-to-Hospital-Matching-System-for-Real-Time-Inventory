@echo off
cd /d "%~dp0"
".venv\Scripts\python.exe" manage.py expire_alerts >> expire_alerts.log 2>&1