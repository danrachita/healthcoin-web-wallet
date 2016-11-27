fs = require('fs.extra');

if (process.platform == 'darwin') { //If Mac OS X
    filepath = process.env.HOME + '/Library/Application Support/Healthcoin/healthcoin.conf';
} else if (process.platform == 'linux') { //If Linux
    filepath = process.env.HOME + '/.healthcoin/healthcoin.conf';
} else { //Else it's Windows
    filepath = process.env.APPDATA + '/Healthcoin/healthcoin.conf';
}

if (fs.existsSync(filepath) === false) { console.log('Conf file does not exists. Copying default conf file...');
fs.copy('healthcoin/healthcoin.conf', filepath, { replace: false }, function (err) {
  if (err) {
    throw err;
  }
  console.log('Copied healthcoin/healthcoin.conf to ' + filepath);
});
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
if (rpcHost === "") rpcHost = "localhost";
if (rpcPort === "") rpcPort = "18184";
if (mdbHost === "") mdbHost = "localhost";
if (mdbPort === "") mdbPort = "27017";

var healthcoin = require('node-healthcoin')();
healthcoin.set('host', rpcHost);
healthcoin.set('port', rpcPort);
healthcoin.auth(rpcUser, rpcPass);

var isLocal = false;
if (rpcHost === "localhost" || rpcHost === "127.0.0.1" || rpcHost.indexOf("192.168.") === 0 || rpcHost.indexOf(".") === -1){
    isLocal = true;
}

module.exports.healthcoin = healthcoin;
module.exports.mdbHost = mdbHost;
module.exports.mdbPort = mdbPort;
module.exports.isLocal = isLocal;
