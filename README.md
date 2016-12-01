# HealthCoin Web Wallet


## Prerequisites:

A running HealthCoin daemon. See:
 https://github.com/onsightit/healthcoin

Node.js running HealthCoin Web Wallet. See:
 https://github.com/onsightit/healthcoin-web-wallet

Mongo DB. See:
 https://www.mongodb.com/


## Configuring:

Configuring the node and daemon for local or non-local operation, or a combination of both.

If the HealthCoin daemon is running on the same machine as the node, the daemon's config file will be used. It can be found at:

 // Mac OS
 '$HOME/Library/Application Support/HealthCoin/healthcoin.conf'

 // Linux
 '$HOME/.healthcoin/healthcoin.conf'

 // Windows
 '$APPDATA/HealthCoin/healthcoin.conf'

If the HealthCoin daemon is running on another machine, you will need to configure the healthcoin.conf file found in the node's path at: healthcoin/healthcoin.conf

Either way, the healthcoin.conf file will need at a minimum the following parameters:

rpcuser=rpcuser
rpcpassword=password  # Change me!
rpcconnect=localhost  # Healthcoin RPC Node
rpcport=18184
mdbhost=localhost     # Healthcoin DB Server
mdbport=27017

The config file parameter 'rpcconnect' determines whether the Application is local or not-local (even if the daemon and node are both running on the same machine). The boolean flag 'isLocal' is determined to be true if 'rpcconnect' is one of the following:

rpcconnect=127.0.0.1
rpcconnect=localhost
rpcconnect=192.168.x.x
rpcconnect=hostname_with_no_tld

The last two examples allow for the Application to be considered 'local', even though the node and daemon may be running on different machines on the same local network.

If the daemon and node are both running on the same machine, you can still define the Application as NOT-local by setting the 'rpcconnect' parameter to a fully qualified domain name (i.e. myhost.homelan.net), requiring a simple modification to the nodes's hosts file. (e.g. 192.168.1.246 myhost.homelan.net)

If 'isLocal' is true, more control over the wallet is allowed. (i.e. encrypt wallet, lock/unlock wallet for sending/staking, more wallet stats, etc.)

[See 'rpcconnect' in the HealthCoin source code, init.cpp, for more information.]
