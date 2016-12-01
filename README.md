# Healthcoin Web Wallet


## Prerequisites:

A running Healthcoin RPC daemon. See:
 https://github.com/onsightit/healthcoin

Mongo DB for storing account info and biomarker data. See:
 https://www.mongodb.com/

Node.js for running the Healthcoin Web Wallet app. See:
 https://github.com/onsightit/healthcoin-web-wallet


## Configuring:

Configuring the database connection parameters and features of the Healthcoin Web Wallet:

  See: settings.json

Configuring the app and daemon for local or non-local operation, or a combination of both:

If the daemon is running on the same machine as the app, the daemon's config file will be used. It can be found at:

 // Mac OS
 '$HOME/Library/Application Support/Healthcoin/healthcoin.conf'

 // Linux
 '$HOME/.healthcoin/healthcoin.conf'

 // Windows
 '$APPDATA/Healthcoin/healthcoin.conf'

If the daemon is running on another machine, you will need to configure the healthcoin.conf file found in the app's path at: healthcoin/healthcoin.conf

Either way, the healthcoin.conf file will need at a minimum the following parameters:

rpcuser=rpcuser
rpcpassword=password  # Change me!
rpcconnect=localhost  # Healthcoin RPC daemon
rpcport=18184

Local vs Not-Local configuration:

The config file parameter 'rpcconnect' determines whether the daemon (and thus the Application) is local or not-local, even if the daemon and app are both running on the same machine. The app's boolean flag 'isLocal' is determined to be true if 'rpcconnect' is one of the following:

rpcconnect=127.0.0.1
rpcconnect=localhost
rpcconnect=192.168.x.x
rpcconnect=hostname_with_no_tld

The last two examples allow for the Healthcoin Web Wallet to be considered 'local', even though the node and daemon may be running on different machines on the same local network.

If the daemon and node are both running on the same machine, you can still define the Application as NOT-local by setting the 'rpcconnect' parameter to a fully qualified domain name (i.e. myhost.homelan.net), which requirs a simple modification to the machine's hosts file. (e.g. 192.168.1.246 myhost.homelan.net)

If 'isLocal' is true, more control over the wallet is allowed. (i.e. encrypting the wallet, locking/unlocking the wallet for sending/staking, and more wallet stats and features are available.)

[See 'rpcconnect' in the Healthcoin source code, init.cpp, for more information.]


## Running:

Windows:

  healthcoin-web-wallet.bat

  (If supervisor is not installed, run 'npm install supervisor'.)

Linux:

  healthcoin-web-wallet.sh

  (If daemon is not installed, please consult your Linux distro's documentation for installing 'daemon'.)

The Wallet has an admin account pre-defined which you can login with:

  Login:    MASTER_ACCOUNT
  Password: password  (you will be required to change this)

The MASTER_ACOUNT always sees the Healthcoin Web Wallet as 'local' and has views into the wallet as if you were running a Qt wallet (i.e. the full wallet balance).

To setup individual accounts, use the Signup page, or login with a social media account.
