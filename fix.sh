cd ../healthcoin/libjl777
./healthcoind stop
pkill -15 healthcoind
sleep 15
./healthcoind
cd ../../healthcoin-explorer
nodejs app.js
