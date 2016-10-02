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

arrayFromConf = conf_data.match(/[^\r\n]+/g); //Turn all lines to an array
var rpcuser = arrayFromConf['0'].substring(arrayFromConf['0'].indexOf("=") + 1); //Only get specific line, and get value after '='
var rpcpass = arrayFromConf['1'].substring(arrayFromConf['1'].indexOf("=") + 1); //Only get specific line, and get value after '='
var rpchost = arrayFromConf['2'].substring(arrayFromConf['2'].indexOf("=") + 1); //Only get specific line, and get value after '='

var healthcoin = require('node-healthcoin')();
healthcoin.auth(rpcuser, rpcpass, rpchost);

module.exports = healthcoin;
