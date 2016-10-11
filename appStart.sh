#!/bin/sh
# Start the Healthcoin node.

#echo Looking for Healthcoin daemon...
#if [ `pgrep healthcoind` ] ; then
    cd ${HOME}
	echo Starting Healthcoin nodejs...
	/usr/bin/daemon --running --name healthcoin-web-wallet
	if [ $? -eq 1 ] ; then
	        /bin/mv healthcoin-web-wallet.log.gz healthcoin-web-wallet.log.gz.bak
	        /bin/gzip healthcoin-web-wallet.log
		#npm install supervisor -g
		/usr/bin/daemon --respawn --name "healthcoin-web-wallet" -D ${HOME}/healthcoin-web-wallet -o ${HOME}/healthcoin-web-wallet.log -- /usr/bin/nodejs --stack-size=10000 app.js
	else
	        echo "Info : healthcoin-web-wallet is already running."
	fi
#else
#        echo "Error : healthcoind is not running."
#fi
