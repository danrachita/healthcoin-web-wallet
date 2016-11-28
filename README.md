{\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1033{\fonttbl{\f0\fnil\fcharset0 Courier New;}}
{\colortbl ;\red0\green0\blue255;}
{\*\generator Riched20 10.0.14393}\viewkind4\uc1 
\pard\b\f0\fs28 HealthCoin Web Wallet\par
\b0\fs22\par
\b\par
Prerequisites:\par
\par
\b0 A running HealthCoin daemon. See:\par
 {{\field{\*\fldinst{HYPERLINK https://github.com/onsightit/healthcoin }}{\fldrslt{https://github.com/onsightit/healthcoin\ul0\cf0}}}}\f0\fs22\par
\par
Node.js running HealthCoin Web Wallet. See:\par
 {{\field{\*\fldinst{HYPERLINK https://github.com/onsightit/healthcoin-web-wallet }}{\fldrslt{https://github.com/onsightit/healthcoin-web-wallet\ul0\cf0}}}}\f0\fs22\par
\par
Mongo DB. See:\par
 {{\field{\*\fldinst{HYPERLINK https://www.mongodb.com/ }}{\fldrslt{https://www.mongodb.com/\ul0\cf0}}}}\b\f0\fs22\par
\par
\par
Configuring:\par
\b0\par
Configuring the node and daemon for local or non-local operation, or a combination of both.\par
\par
If the HealthCoin daemon is running on the same machine as the node, the daemon's config file will be used. It can be found at:\par
\par
 // Mac OS\par
 '$HOME/Library/Application Support/HealthCoin/healthcoin.conf'\par
\par
 // Linux\par
 '$HOME/.healthcoin/healthcoin.conf'\par
\par
 // Windows\par
 '$APPDATA/HealthCoin/healthcoin.conf'\par
\par
If the HealthCoin daemon is running on another machine, you will need to configure the healthcoin.conf file found in the node's path at: healthcoin/healthcoin.conf\par
\par
Either way, the healthcoin.conf file will need at a minimum the following parameters:\par
\par
rpcuser=rpcuser\par
rpcpassword=password  # Change me!\par
rpcconnect=localhost  # Healthcoin RPC Node\par
rpcport=18184\par
mdbhost=localhost     # Healthcoin DB Server\par
mdbport=27017\par
\par
The config file parameter 'rpcconnect' determines whether the Application is local or not-local (even if the daemon and node are both running on the same machine). The boolean flag 'isLocal' is determined to be true if 'rpcconnect' is one of the following:\par
\par
rpcconnect=127.0.0.1\par
rpcconnect=localhost\par
rpcconnect=192.168.x.x\par
rpcconnect=hostname_with_no_tld\par
\par
The last two examples allow for the Application to be considered 'local', even though the node and daemon may be running on different machines on the same local network.\par
\par
If the daemon and node are both running on the same machine, you can still define the Application as NOT-local by setting the 'rpcconnect' parameter to a fully qualified domain name (i.e. myhost.homelan.net), requiring a simple modification to the nodes's hosts file. (e.g. 192.168.1.246 myhost.homelan.net)\par
\par
If 'isLocal' is true, more control over the wallet is allowed. (i.e. encrypt wallet, lock/unlock wallet for sending/staking, more wallet stats, etc.)\par
\par
[See 'rpcconnect' in the HealthCoin source code, init.cpp, for more information.]\par
\par
}
 