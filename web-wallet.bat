@echo off
echo *** Starting web-wallet...
REM npm install supervisor -g
start /min supervisor app.js
timeout 5 > NUL
start "" http://127.0.0.1:8181/
exit
