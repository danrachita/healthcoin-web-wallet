fs = require('fs.extra');
//
// If the healthcoin daemon is running on the same machine as the node, its config file will be used.
// Otherwise, you will need to configure the config file found in: healthcoin/healthcoin.conf
//
// See README.md for more information.
//
if (process.platform == 'darwin'){
    // Mac OS
    filepath = process.env.HOME + '/Library/Application Support/HealthCoin/healthcoin.conf';
} else if (process.platform == 'linux'){
    // Linux
    filepath = process.env.HOME + '/.healthcoin/healthcoin.conf';
} else {
    // Windows
    filepath = process.env.APPDATA + '/HealthCoin/healthcoin.conf';
}

if (fs.existsSync(filepath) === false){
    console.log("Config file does not exists. Using the node's config file...");
    filepath = 'healthcoin/healthcoin.conf';
}

conf_data = fs.readFileSync(filepath, 'utf8', function (err) {
  if (err) {
    return console.log(err);
  }
});

function wordTrim(str){
    str.trim();
    var idx = str.search(/\s/); // look for whitespace after first word (ie. comments)
    if (idx !== -1){
        str = str.substring(0, idx);
    }
    return str;
}

arrayFromConf = conf_data.match(/[^\r\n]+/g); // Turn lines into array

var rpcUser = "";
var rpcPass = "";
var rpcHost = "";
var rpcPort = "";
var mdbHost = "";
var mdbPort = "";

for (var k in arrayFromConf){
    if (arrayFromConf.hasOwnProperty(k)){
        // Get specific parm and value before and after '='
        var p = wordTrim(arrayFromConf[k].substring(0, arrayFromConf[k].indexOf("=")));
        var v = wordTrim(arrayFromConf[k].substring(arrayFromConf[k].indexOf("=") + 1));
        switch(p){
            case ("rpcuser"):
                rpcUser = v;
                break;
            case ("rpcpassword"):
                rpcPass = v;
                break;
            case ("rpcconnect"):
                rpcHost = v.toLowerCase();
                break;
            case ("rpcport"):
                rpcPort = v;
                break;
            case ("mdbhost"):
                mdbHost = v.toLowerCase();
                break;
            case ("mdbport"):
                mdbPort = v;
                break;
            default:
                break;
        }
    }
}
// Validation checks
if (rpcHost === "") rpcHost = "127.0.0.1";
if (rpcPort === "") rpcPort = "18184";
if (mdbHost === "") mdbHost = "127.0.0.1";
if (mdbPort === "") mdbPort = "27017";

var isLocal = false;
if (rpcHost === "localhost" || rpcHost === "127.0.0.1" || rpcHost.indexOf("192.168.") === 0 || rpcHost.indexOf(".") === -1){
    isLocal = true;
}

var api = require('node-healthcoin')();
api.set('host', rpcHost);
api.set('port', rpcPort);
api.set('user', rpcUser);
api.set('pass', rpcPass);
//if (!isLocal) api.set('https', true); // TODO: Get https working with rpc.
api.auth();

module.exports.api = api;
module.exports.isLocal = isLocal;
module.exports.rpcHost = rpcHost;
module.exports.rpcPort = rpcPort;
module.exports.mdbHost = mdbHost;
module.exports.mdbPort = mdbPort;
