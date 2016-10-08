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
    var idx = str.indexOf(/^\s+$/); // look for whitespace after first word (ie. comments)
    if (idx !== -1){
        str = str.substring(0, idx);
    }
    return str;
}

arrayFromConf = conf_data.match(/[^\r\n]+/g); // Turn lines into array

var rpcuser = "";
var rpcpass = "";
var rpchost = "";
var rpcport = "";
var mdbhost = "";
var mdbport = "";

for (var k in arrayFromConf){
    if (arrayFromConf.hasOwnProperty(k)){
        // Get specific parm and value before and after '='
        var p = wordTrim(arrayFromConf[k].substring(0, arrayFromConf[k].indexOf("=")));
        var v = wordTrim(arrayFromConf[k].substring(arrayFromConf[k].indexOf("=") + 1));
        switch(p){
            case ("rpcuser"):
                rpcuser = v;
                break;
            case ("rpcpass"):
                rpcpass = v;
                break;
            case ("rpchost"):
                rpchost = v.toLowerCase();
                break;
            case ("rpcport"):
                rpcport = v;
                break;
            case ("mdbhost"):
                mdbhost = v.toLowerCase();
                break;
            case ("mdbport"):
                mdbport = v;
                break;
            default:
                break;
        }
    }
}
// Validation check
if (rpchost === "") rpchost = "localhost";
if (rpcport === "") rpcport = "18184";
if (mdbhost === "") mdbhost = "localhost";
if (mdbport === "") mdbport = "27017";

var healthcoin = require('node-healthcoin')();
healthcoin.auth(rpcuser, rpcpass, rpchost);

var isLocal = false;
if (rpchost === "localhost" || rpchost === "127.0.0.1" || rpchost.indexOf(".") === -1){
    isLocal = true;
}

// DEBUG
//console.log("DEBUG: " + mdbhost + ":" + mdbport);

module.exports = healthcoin;
module.exports.rpcHost = rpchost;
module.exports.rpcPort = rpcport;
module.exports.mdbHost = mdbhost;
module.exports.mdbPort = mdbport;
module.exports.isLocal = isLocal;
