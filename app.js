/**
 *  Web Wallet
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


////////// Config //////////


// coin Object - Localization settings and Node api calls for the client.
var coin = require('./lib/coinapi');
module.exports = coin;

// Mongoose schema for biomarkers (unique to healthcoin)
var Biomarkers = require('./lib/biomarkers');

var fs = require('fs');
var path = require('path');
var atob = require('atob');
var btoa = require('btoa');

var privateKey  = fs.readFileSync(coin.settings.sslKey, 'utf8');
var certificate = fs.readFileSync(coin.settings.sslCrt, 'utf8');
var credentials = {key: privateKey, cert: certificate};

var express = require('express');
var app = express();

var cors = require('cors');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var uuid = require('uuid');
var session = require('express-session');

var passport = require('passport');
var flash = require('connect-flash');

// All environments
app.set('env', coin.settings.env || 'production');
app.set('port', coin.isLocal ? coin.settings.port : coin.settings.sslPort);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, coin.settings.favicon)));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({name: coin.settings.coinName,
                secret: coin.settings.coinName + ' is the best ' + coin.settings.coinTitle,
                genid: function(req) {
                    return uuid.v4(); // use UUIDs
                },
                // Cookie expires in 30 days
                cookie: {secure: coin.isLocal ? false : true, maxAge: 30 * 24 * 60 * 60 * 1000, domain: coin.settings.appHost},
                saveUninitialized: false,
                resave: true}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());            // use connect-flash for flash messages stored in session (Bug: Has to come after session and before router.)

// DB Functions
var mdb = require('./lib/database');
var dbString = 'mongodb://' + coin.settings.mdb.user;
dbString = dbString + ':' + coin.settings.mdb.password;
dbString = dbString + '@' + coin.settings.mdb.host;
dbString = dbString + ':' + coin.settings.mdb.port;
dbString = dbString + '/' + coin.settings.mdb.database;
coin.settings.mdb.password = "XXXXXXXX";
coin.settings.mdb = null; // garbage collection

// Connects or exits
mdb.connect(dbString, function() {
    console.log('Connected to database.');
});

// Auth routes / functions
require('./routes/auth.js')(app, passport); // Auth routes (includes: '/', '/signup', '/login', '/logout', '/profile', '/password', + oauth routes).
require('./lib/passport')(passport);        // Requires exported 'coin'

// Localizations for the client [MUST COME AFTER DB FUNCTIONS] (i.e. for EJS rendered settings)
for (var s in coin.settings){
    if (coin.settings.hasOwnProperty(s)){
        // Don't overwrite!
        if (app.get(s) === undefined)
            app.set(s, coin.settings[s]);
    }
}


////////// Routes //////////


// Add CORS headers to all requests
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-AUTHENTICATION, X-IP, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Handler for indirect calls to the coin daemon.
function callCoin(command, res, handler){
    var args = Array.prototype.slice.call(arguments, 3);   // Args are after the 3rd parameter
    var callargs = args.concat([handler.bind({res:res})]); // Add the handler function to args
    return coin.api[command].apply(coin.api, callargs, coin.settings.env);
}

function coinHandler(err, result){
    var response = {
        error: JSON.parse(err ? err.message : null),
        result: result
    };
    if (typeof this.res.send !== 'undefined' && this.res.send){
        this.res.send(JSON.stringify(response));
    }
}

// Non-RPC routes //

// Returns this rpc wallet node info and some localized settings.
app.get('/getnodeinfo', function(req,res){
    var response = {
        error: null,
        result: {
            node_id: coin.rpcHost,
            isLocal: coin.isLocal,
            settings: coin.settings
        }
    };
    res.send(JSON.stringify(response));
});

// Returns user account and address.
app.get('/getuseraccount', function(req,res){
    if (req.user) {
        var response = {
            error: null,
            result: { User: req.user }
        };
        res.send(JSON.stringify(response));
    } else {
        res.redirect('/logout');
    }
});

// Saves user profile.
app.get('/saveuserprofile/:profile', function(req,res){
    var profile = JSON.parse(atob(decodeURIComponent(req.params.profile))) || req.user.profile,
        result = null;
    if (profile && profile.login_type){
        req.user.profile = profile;
        result = mdb.saveUserProfile(req.user._id, profile);
    }
    var response = {
        error: null,
        result: result
    };
    res.send(JSON.stringify(response));
});


// RPC routes //

app.get('/getinfo', function(req,res){ callCoin('getInfo', res, coinHandler); } );
app.get('/getinterestrate', function(req,res){ callCoin('getInterestRate', res, coinHandler); } );
app.get('/getinflationrate', function(req,res){ callCoin('getInflationRate', res, coinHandler); } );
app.get('/getblockcount', function(req,res){ callCoin('getBlockCount', res, coinHandler); } );
app.get('/getstakinginfo', function(req,res) { callCoin('getStakingInfo', res, coinHandler); } );

// pagination view
app.get('/listtransactions/:account/:page', function(req, res){
    var account = (req.params.account || ''),
        page = (req.params.page || 1),
        count = coin.settings.historyRowsPP,
        from = 0;
    if (page < 1) page = 1;
    from = count * page - count;
    if (account.length > 1){
        if (account === coin.settings.masterAccount) account = "*";
        callCoin('listTransactions', res, coinHandler, account, count, from);
    }
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/makekeypair', function(req, res){
    callCoin('makekeypair', res, coinHandler);
});

app.get('/getbalance/:account', function(req, res){
    var account = req.params.account || '';
    if(account.length > 1)
        callCoin('getbalance', res, coinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

// Note: The wallet is account based. Always use accounts!
app.get('/sendfrom/:fromaccount/:toaddress/:amount/:minconf?/:comment?/:commentto?/:txcomment?', function(req, res){
    var fromaccount = req.params.fromaccount || '';
    var toaddress = req.params.toaddress || '';
    var amount = parseFloat(req.params.amount) || 0.0;
    var maxSendAmount = parseFloat(coin.settings.maxSendAmount) || 0.0001; // Haha
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || '';
    var commentto = req.params.commentto || '';
    var txcomment = atob(decodeURIComponent(req.params.txcomment)) || '';
    if(fromaccount.length && toaddress.length && amount && amount <= maxSendAmount){
        if (txcomment !== ''){
            if (comment === 'HCBM'){
                var credit = amount * 2; // See Biomarkers
                // Add user's biomarker using schema and encode back to hcbm:txcomment before sending.
                var txcommentObj = JSON.parse(txcomment) || {};
                var Biomarker = new Biomarkers().buildBiomarker(credit, req.user._id, txcommentObj);
                txcomment = "hcbm:" + btoa(JSON.stringify(Biomarker));
            }
        }
        callCoin('sendfrom', res, coinHandler, fromaccount, toaddress, amount, minconf, comment, commentto, txcomment);
    } else {
        if (amount > maxSendAmount)
            res.send(JSON.stringify("Error: Amount is greater than the maximum of " + maxSendAmount + "."));
        else
            res.send(JSON.stringify("Error: Invalid sendfrom parameters."));
    }
});

// Note: Use sendfrom instead as the wallet is account based
app.get('/sendtoaddress/:toaddress/:amount', function(req, res){
    var amount = parseFloat(req.params.amount);
    callCoin('sendtoaddress', res, coinHandler, req.params.toaddress, amount);
});

app.get('/move/:fromaccount/:toaccount/:amount/:minconf?/:comment?', function(req, res){
    var fromaccount = req.params.fromaccount || '';
    var toaccount = req.params.toaccount || '';
    var amount = parseFloat(req.params.amount) || 0.0;
    var maxSendAmount = parseFloat(coin.settings.maxSendAmount) || 0.0001; // Haha
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || ''; // Not txcomment
    if(fromaccount.length > 1 && toaccount.length > 1 && amount > 0 && amount <= maxSendAmount)
        callCoin('move', res, coinHandler, fromaccount, toaccount, amount, minconf, comment);
    else
        res.send(JSON.stringify("Error: Invalid move."));
});

app.get('/getnewaddress/:account', function(req, res){
    var account = req.params.account || '';
    if(account.length > 1)
        callCoin('getnewaddress', res, coinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/setaccount/:address/:account', function(req, res){
    coin.api.setaccount(req.params.address, req.params.account, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/validateaddress/:address', function(req, res){
    var address = req.params.address || 'blah';
    callCoin('validateaddress', res, coinHandler, address);
});

app.get('/encryptwallet/:passphrase', function(req,res){
    var passphrase = atob(req.params.passphrase); // TODO: Use encryption instead of base64
    if (passphrase){
        callCoin('encryptwallet', res, coinHandler, passphrase);
    }
});

app.get('/walletpassphrase/:passphrase/:timeout/:stakingonly', function(req,res){
    var stakingOnly = req.params.stakingonly === 'true',
        timeout = parseInt(req.params.timeout),
        passphrase = atob(req.params.passphrase); // TODO: Use encryption instead of base64
    if (passphrase){
        callCoin('walletpassphrase', res, coinHandler, passphrase, timeout, stakingOnly);
    }
});

app.get('/walletlock', function(req,res){ callCoin('walletlock', res, coinHandler); });

app.get('/help/:commandname?', function(req, res){
    if (req.params.commandname !== undefined)
        callCoin('help', res, coinHandler, req.params.commandname);
    else
        callCoin('help', res, coinHandler);
});

app.get('/listreceivedbyaddress/:minconf?/:includeempty?', function(req, res){
    var includeEmpty = (req.params.includeempty || false) === 'true', 
        minConf = parseInt(req.params.minconf || 1);
    callCoin('listreceivedbyaddress', res, coinHandler, minConf, includeEmpty);
});

app.get('/getaccount/:address', function(req, res){
    coin.api.getaccount(req.params.address, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/listaddressgroupings', function(req, res){
    coin.api.listaddressgroupings(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/setadressbookname/:address/:label', function(req, res){
    coin.api.setadressbookname(req.params.address, req.params.label, function(err, result){
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

// Catch session timeout
app.use(function(req, res, next) {
    if (req.session && Date.now() <= req.session.cookie.expires){
        next();
    } else {
   		res.redirect('/');
    }
});

// This goes last.
app.use(function(err, req, res, next) {
    res.status(404);
    console.log("DEBUG: 404 found.");
    if (req.accepts('html')) {
        if (app.get('env') === 'development') {
            // development error handler will print stacktrace
            res.render('error', {
                message: err.message,
                error: JSON.stringify(err)
            });
            return;
        } else {
            // production error handler no stacktraces leaked to user
            res.render('error', {
                message: err.message,
                error: {}
            });
            return;
        }
    }
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }
    res.type('txt').send('Not found');
    next();
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
function startApp(app) {
    // Start the Express server
    console.log("Express " + (coin.isLocal ? "" : "Secure ") + "Server starting...");
    var protocol = coin.isLocal ? require('http') : require('https');
    var server = coin.isLocal ? protocol.createServer(app) : protocol.createServer(credentials, app);
    var port = coin.isLocal ? coin.settings.port : coin.settings.sslPort;

    server.listen(port, function(){
        // Init MASTER_ACCOUNT in wallet and database for this node_id (Requires exported 'coin')
        require('./lib/init-wallet')();

        var io = require('socket.io')(server, {
                port: port
            });
        io.on('connection', function (socket) {
            socket.emit('news', { news: 'Socket.io connected!' });
            socket.on('news', function (data) {
              console.log(data);
            });
            socket.on('connect_error', function (err) {
                socket.emit('news', { news: 'Node socket connection error.' });
                console.log("Socket.io Error: " + err);
            });
            process.on('uncaughtException', function (err) {
              socket.emit('news', { news: 'Wallet connection error.' });
              console.log('Caught exception: ' + err);
              tryReconnect();
            });
        });
        console.log('  Server listening on port ' + port);
    });
}
startApp(app);
