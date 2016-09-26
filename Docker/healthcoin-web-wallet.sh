#!/bin/bash

# Note: To stop run: daemon --stop --name healthcoin-web-wallet

trap "exit 255" SIGINT SIGTERM

while :
do
    DATETIME=`date`
    /usr/bin/daemon --running --name healthcoin-web-wallet
    if [ $? == 1 ] ; then
        echo "*** $DATETIME : Starting healthcoin-web-wallet..."
        cd ${HOME}
        /bin/mv healthcoin-web-wallet.log.gz healthcoin-web-wallet.log.gz.bak
        /bin/gzip healthcoin-web-wallet.log
        /usr/bin/daemon --name "healthcoin-web-wallet" -D ${HOME}/healthcoin-web-wallet -o ${HOME}/healthcoin-web-wallet.log -- /usr/bin/nodejs --stack-size=10000 ${HOME}/healthcoin-web-wallet/app.js
    fi
    sleep 60
done
