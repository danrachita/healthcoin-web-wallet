#!/bin/bash
### executed by cron every 10 minutes. ###

# Note: To stop run: daemon --stop --name healthcoin-web-wallet

/usr/bin/daemon --running --name healthcoin-web-wallet

if [ $? == 1 ] ; then
        echo "*** Starting healthcoin-web-wallet..."
        cd ${HOME}/
        /bin/mv healthcoin-web-wallet.log.gz healthcoin-web-wallet.log.gz.bak
        /bin/gzip healthcoin-web-wallet.log
        /usr/bin/daemon --name "healthcoin-web-wallet" -D ${HOME}/healthcoin-web-wallet -o ${HOME}/healthcoin-web-wallet.log -- /usr/bin/nodejs --stack-size=10000 ${HOME}/healthcoin-web-wallet/app.js
else
        echo "*** The healthcoin-web-wallet is already running."
fi
