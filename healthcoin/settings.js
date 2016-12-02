/**
* The Settings Module reads the settings out of settings.json and provides
* this information to other modules
*/

var fs = require("fs");
var jsonminify = require("jsonminify");

// Runtime environment: 'development' or 'production'
exports.env = "development";

// The app title, visible in browser window
exports.title = "Healthcoin Web Wallet";

// Coin name / page heading
exports.coinname = "healthcoin";

// Coin symbol, e.g. BTC, VRC, SLR, HCN, ...
exports.coinsymbol = "HCN";

// Logo
exports.logo = "./public/images/Icon.png";

// History rows per page
exports.historyRowsPP = 10;

// The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = "./public/favicon.ico";

// Amount to send new users at sign-up
exports.newUserAmount  = 1.0;

// Some control over how much can be sent at one time
exports.maxSendAmount  = 1000.0;                      

// The url accessing the app. If the web wallet is running on a localhost, this will be ignored.
// e.g. myhost.homelan.net
exports.appHost = "127.0.0.1";

// The ports express should listen on
exports.port = process.env.PORT || 8181;
exports.sslport = process.env.SSLPORT || 8383;

// SSL certs
exports.sslKey = "./sslcert/server.key";
exports.sslCrt = "./sslcert/server.crt";

// This setting is passed to MongoDB to set up the database
exports.mdbSettings = {
  "user": "healthcoin",
  "password": "password",
  "database": "healthcoin",
  "host" : "127.0.0.1",
  "port" : 27017
};

// MASTER_ACCOUNT settings. *** DO NOT CHANGE ACCOUNT AFTER FIRST RUN! ***
exports.masterAccount  = "MASTER_ACCOUNT";            // Master UI login account, and Label to assign to "" wallet accounts.
exports.masterEmail    = "healthcoin@localhost";      // Master email account.
exports.masterCanEncrypt = false;                     // Allow wallet encryption by MASTER_ACCOUNT


exports.reloadSettings = function reloadSettings() {
    // Discover where the settings file lives
    var settingsFilename = "./settings.json";

    var settingsStr;
    try {
        settingsStr = fs.readFileSync(settingsFilename).toString();
    } catch(e) {
        console.warn('No settings.json file found. Continuing using defaults!');
    }

    // Parse the settings
    var settings;
    try {
        if (settingsStr) {
            settingsStr = jsonminify(settingsStr).replace(",]","]").replace(",}","}");
            settings = JSON.parse(settingsStr);
        }
    } catch(e) {
        console.error('There was an error processing your settings.json file: '+e.message);
        process.exit(1);
    }

    // Loop trough the settings
    for (var i in settings) {
        if (i) {
            // Test if the setting start with a low character
            if (i.charAt(0).search("[a-z]") !== 0) {
                console.warn("Settings should start with a low character: '" + i + "'");
            }
            //we know this setting, so we overwrite it
            if(exports[i] !== undefined) {
                exports[i] = settings[i];
            } else {
                console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed.");
            }
        }
    }
};

// Initial load settings
exports.reloadSettings();
