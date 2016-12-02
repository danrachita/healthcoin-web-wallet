/**
 *  Healthcoin Web Wallet
 *  Author: Steve Woods OnsightIT@gmail.com
 *          https://github.com/onsightit
 *
 *  (Pending Open Source GNU License)
 */

Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        var alt = {};
        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);
        return alt;
    },
    configurable: true
});

// Get the user defined application settings.
var settings = require('./healthcoin/settings');

// APP Object - options and api calls for the client.
var APP = require('./healthcoin/healthcoinapi');
APP.appHost          = APP.isLocal ? "127.0.0.1" : settings.appHost; // Hostname of node.js / webserver (See README.md)
APP.masterAccount    = settings.masterAccount;      // Master UI login account, and Label to assign to "" account(s).
APP.masterEmail      = settings.masterEmail;        // Master email account.
APP.masterCanEncrypt = settings.masterCanEncrypt;   // Master can encrypt the wallet
APP.newUserAmount    = settings.newUserAmount;      // Amount to send new users at sign-up.
APP.settings =  {                                   // A sub-set of settings.json for the client
                title: settings.title,
                coinname: settings.coinname,
                coinsymbol: settings.coinsymbol,
                logo: settings.logo,
                newUserAmount: settings.newUserAmount,
                maxSendAmount: settings.maxSendAmount,
                env: settings.env
                };
module.exports = APP;
// End APP Object

// Mongoose schema for biomarkers
var Biomarkers = require('./healthcoin/biomarkers');

var fs = require('fs');
var path = require('path');
var atob = require('atob');
var btoa = require('btoa');

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var privateKey  = fs.readFileSync(settings.sslKey, 'utf8');
var certificate = fs.readFileSync(settings.sslCrt, 'utf8');
var credentials = {key: privateKey, cert: certificate};

var app = express();

var cookieParser = require('cookie-parser');
var session = require('express-session');
var uuid = require('uuid');
var morgan = require('morgan');
var passport = require('passport');
var flash = require('connect-flash');

// All environments
app.use(cors());
app.set('port', APP.isLocal ? settings.port : settings.sslport);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Localizations
app.set('title', settings.title);
app.set('coinname', settings.coinname);
app.set('coinsymbol', settings.coinsymbol);
app.set('logo', settings.logo);
app.set('newUserAmount', settings.newUserAmount);
app.set('maxSendAmount', settings.maxSendAmount);
app.set('env', settings.env);

// Auth modules
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({name: 'healthcoin',
                secret: 'nequals1 describes unity',
                genid: function(req) {
                    return uuid.v4(); // use UUIDs
                },
                // Cookie expires in 30 days
                cookie: {secure: APP.isLocal ? false : true, maxAge: 30 * 24 * 60 * 60 * 1000, domain: APP.appHost},
                saveUninitialized: false,
                resave: true}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());            // use connect-flash for flash messages stored in session (Bug: Has to come after session and before router.)

app.use(favicon(path.join(__dirname, settings.favicon)));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers to all requests
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-AUTHENTICATION, X-IP, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// DB Functions
var mdb = require('./healthcoin/database');
var dbString = 'mongodb://' + settings.mdbSettings.user;
dbString = dbString + ':' + settings.mdbSettings.password;
dbString = dbString + '@' + settings.mdbSettings.host;
dbString = dbString + ':' + settings.mdbSettings.port;
dbString = dbString + '/' + settings.mdbSettings.database;

// Connects or exits
mdb.connect(dbString, function() {
    console.log('Connected to database.');
});

// Auth Functions
require('./healthcoin/init-wallet')();      // Requires APP
require('./routes/auth.js')(app, passport); // Auth routes (includes: '/', '/signup', '/login', '/logout', '/profile', '/password', + oauth routes).
require('./healthcoin/passport')(passport); // Requires APP

if (app.get('env') === 'development') {
    // development error handler will print stacktrace
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: JSON.stringify(err)
        });
    });
} else {
    // production error handler no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

// Healthcoin handler for indirect calls to daemon
function callHealthcoin(command, res, handler){
    var args = Array.prototype.slice.call(arguments, 3);   // Args are after the 3rd function parameter
    var callargs = args.concat([handler.bind({res:res})]); // Add the handler function to args
    return APP.api[command].apply(APP.api, callargs, APP.settings.env);
}
function healthcoinHandler(err, result){
    var response = {
        error: JSON.parse(err ? err.message : null),
        result: result
    };
    if (typeof this.res.send !== 'undefined' && this.res.send){
        this.res.send(JSON.stringify(response));
    }
}


// Non-RPC routes //

// Returns this rpc wallet node info and some settings.
app.get('/getnodeinfo', function(req,res){
    var response = {
        error: null,
        result: {
            node_id: APP.rpcHost,
            isLocal: APP.isLocal,
            settings: APP.settings
        }
    };
    res.send(JSON.stringify(response));
});

// Returns user account and address.
app.get('/getuseraccount', function(req,res){
    if (req.session && req.session.User) {
        var response = {
            error: null,
            result: { User: req.session.User }
        };
        res.send(JSON.stringify(response));
    } else {
        res.redirect('/login');
    }
});

// Saves user profile.
app.get('/saveuserprofile/:profile', function(req,res){
    var profile = JSON.parse(atob(decodeURIComponent(req.params.profile))) || req.session.User.profile,
        result = null;
    if (profile && profile.login_type){
        req.session.User.profile = profile;
        result = mdb.saveUserProfile(req.session.User._id, profile);
    }
    var response = {
        error: null,
        result: result
    };
    res.send(JSON.stringify(response));
});


// RPC routes //

app.get('/getinfo', function(req,res){ callHealthcoin('getInfo', res, healthcoinHandler); } );
app.get('/getinterestrate', function(req,res){ callHealthcoin('getInterestRate', res, healthcoinHandler); } );
app.get('/getinflationrate', function(req,res){ callHealthcoin('getInflationRate', res, healthcoinHandler); } );
app.get('/getblockcount', function(req,res){ callHealthcoin('getBlockCount', res, healthcoinHandler); } );
app.get('/getstakinginfo', function(req,res) { callHealthcoin('getStakingInfo', res, healthcoinHandler); } );

// pagination view
app.get('/listtransactions/:account/:page', function(req, res){
    var account = (req.params.account || '*'),
        page = (req.params.page || 1),
        count = 10,     // TODO: Parameterize this.
        from = 0;
    if (page < 1) page = 1;
    from = count * page - count;
    if (account.length > 1){
        if (account === APP.masterAccount) account = "*";
        callHealthcoin('listTransactions', res, healthcoinHandler, account, count, from);
    }
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/makekeypair', function(req, res){
    callHealthcoin('makekeypair', res, healthcoinHandler);
});

app.get('/getbalance/:account', function(req, res){
    var account = req.params.account || '*';
    if(account.length > 1)
        callHealthcoin('getbalance', res, healthcoinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

// Note: The wallet is account based. Always use accounts!
app.get('/sendfrom/:fromaccount/:toaddress/:amount/:minconf?/:comment?/:commentto?/:txcomment?', function(req, res){
    var fromaccount = req.params.fromaccount || '*';
    var toaddress = req.params.toaddress || '';
    var amount = parseFloat(req.params.amount) || 0.0;
    var maxSendAmount = parseFloat(app.get('maxSendAmount')) || 0.0001; // Haha
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || '';
    var commentto = req.params.commentto || '';
    var txcomment = atob(decodeURIComponent(req.params.txcomment)) || '';
    if(fromaccount.length > 1 && toaddress.length > 1 && amount > 0 && amount <= maxSendAmount){
        if (comment === "HCBM" && txcomment !== ''){
            // Add user's biomarker using schema and encode back to hcbm:txcomment before sending.
            var txcommentObj = JSON.parse(txcomment) || {};
            var Biomarker = new Biomarkers().buildBiomarker(amount, req.session.User._id, txcommentObj);
            txcomment = "hcbm:" + btoa(JSON.stringify(Biomarker));
            callHealthcoin('sendfrom', res, healthcoinHandler, fromaccount, toaddress, amount, minconf, comment, commentto, txcomment);
        } else {
            callHealthcoin('sendfrom', res, healthcoinHandler, fromaccount, toaddress, amount);
        }
    } else {
        if (amount > maxSendAmount)
            res.send(JSON.stringify("Error: Amount is greater than the maximum of " + maxSendAmount + "."));
        else
            res.send(JSON.stringify("Error: Invalid sendfrom parameters."));
    }
});

// Note: Use sendfrom instead as the wallet is account based
app.get('/sendtoaddress/:toaddress/:amount/:comment?/commentto?/:txcomment?', function(req, res){
    var amount = parseFloat(req.params.amount);
    callHealthcoin('sendtoaddress', res, healthcoinHandler, req.params.toaddress, amount);
});

app.get('/move/:fromaccount/:toaccount/:amount/:minconf?/:comment?', function(req, res){
    var fromaccount = req.params.fromaccount || '*';
    var toaccount = req.params.toaccount || '*';
    var amount = parseFloat(req.params.amount) || 0.0;
    var maxSendAmount = parseFloat(app.get('maxSendAmount')) || 0.0001; // Haha
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || ''; // Not txcomment
    if(fromaccount.length > 1 && toaccount.length > 1 && amount > 0 && amount <= maxSendAmount)
        callHealthcoin('move', res, healthcoinHandler, fromaccount, toaccount, amount, minconf, comment);
    else
        res.send(JSON.stringify("Error: Invalid move."));
});

app.get('/getnewaddress/:account', function(req, res){
    var account = req.params.account || '*';
    if(account.length > 1)
        callHealthcoin('getnewaddress', res, healthcoinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/setaccount/:address/:account', function(req, res){
    APP.api.setaccount(req.params.address, req.params.account, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/validateaddress/:address', function(req, res){
    var address = req.params.address || 'blah';
    callHealthcoin('validateaddress', res, healthcoinHandler, address);
});

app.get('/encryptwallet/:passphrase', function(req,res){
    var passphrase = atob(req.params.passphrase); // TODO: Use encryption instead of base64
    if (passphrase){
        callHealthcoin('encryptwallet', res, healthcoinHandler, passphrase);
    }
});

app.get('/walletpassphrase/:passphrase/:timeout/:stakingonly', function(req,res){
    var stakingOnly = req.params.stakingonly === 'true',
        timeout = parseInt(req.params.timeout),
        passphrase = atob(req.params.passphrase); // TODO: Use encryption instead of base64
    if (passphrase){
        callHealthcoin('walletpassphrase', res, healthcoinHandler, passphrase, timeout, stakingOnly);
    }
});

app.get('/walletlock', function(req,res){ callHealthcoin('walletlock', res, healthcoinHandler); });

app.get('/help/:commandname?', function(req, res){
    if (req.params.commandname !== undefined)
        callHealthcoin('help', res, healthcoinHandler, req.params.commandname);
    else
        callHealthcoin('help', res, healthcoinHandler);
});

app.get('/listreceivedbyaddress/:minconf?/:includeempty?', function(req, res){
    var includeEmpty = (req.params.includeempty || false) === 'true', 
        minConf = parseInt(req.params.minconf || 1);
    callHealthcoin('listreceivedbyaddress', res, healthcoinHandler, minConf, includeEmpty);
});

app.get('/getaccount/:address', function(req, res){
    APP.api.getaccount(req.params.address, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/listaddressgroupings', function(req, res){
    APP.api.listaddressgroupings(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/setadressbookname/:address/:label', function(req, res){
    APP.api.setadressbookname(req.params.address, req.params.label, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

// Custom routes //

app.get('/', function(req, res){
    res.render('index');
});

// *** Express 4.x requires these app.use calls to be after any app.get or app.post routes.
// *** "Your code should move any calls to app.use that came after app.use(app.router) after any routes (HTTP verbs)."

// catch session timeout
app.use(function(req, res, next) {
    if (req.session && Date.now() <= req.session.cookie.expires){
        next();
    } else {
   		res.redirect('/');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// TODO: Needs testing
function tryReconnect(){
    setTimeout(function(){
        mdb.connect(dbString, function(){
            console.log('Reconnected to database.');
        });
    },5000);
}

// Start it up!
function startHealthcoin(app) {
    // Start the Healthcoin Express server
    console.log("Healthcoin Express " + (APP.isLocal ? "" : "Secure ") + "Server starting...");
    var protocol = APP.isLocal ? require('http') : require('https');
    var server = APP.isLocal ? protocol.createServer(app) : protocol.createServer(credentials, app);

    server.listen(app.get('port'), function(){
        var io = require('socket.io')(server, {
                port: app.get('port')
            });
        io.on('connection', function (socket) {
            socket.emit('news', { news: 'Socket.io connected!' });
            socket.on('news', function (data) {
              console.log(data);
            });
            socket.on('connect_error', function (err) {
                socket.emit('news', { news: 'Healthcoin socket connection error.' });
                console.log("Socket.io Error: " + err);
            });
            process.on('uncaughtException', function (err) {
              socket.emit('news', { news: 'Healthcoin node connection error.' });
              console.log('Caught exception: ' + err);
              tryReconnect();
            });
        });
        console.log('  Server listening on port ' + app.get('port'));
    });
}
startHealthcoin(app);
