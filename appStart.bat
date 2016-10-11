@echo off
REM Start the Healthcoin node and launch a web browser
REM echo Starting Healthcoin daemon...
REM start healthcoin/healthcoind -conf=healthcoin/healthcoin.conf
echo Starting Healthcoin nodejs...
REM npm install supervisor -g
start /min supervisor app.js
timeout 5 > NUL
echo Launching Healthcoin Wallet...
start "" http://127.0.0.1:8181/
exit
