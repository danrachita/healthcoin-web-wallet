/**
 * Module dependencies.
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

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var app = express();

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var healthcoinApi = require("./healthcoinapi");
var healthcoin = healthcoinApi.healthcoin; // healthcoin opts
var rpcHost = healthcoinApi.rpcHost;
var rpcPort = healthcoinApi.rpcPort;
var mdbHost = healthcoinApi.mdbHost;
var mdbPort = healthcoinApi.mdbPort;
var isLocal = healthcoinApi.isLocal;

// Auth modules
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'nequals1',
                 saveUninitialized: true,
                 resave: true}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session (Bug: Has to come after session and before router.)

// All environments
app.use(cors());
app.set('port', process.env.PORT || 8181);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(bodyParser.json());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Functions for calling healthcoind from client
var healthcoinObj         = {}; // healthcoinObj exported for other modules.
healthcoinObj.response    = "";
healthcoinObj.hcn_account = "";
healthcoinObj.hcn_address = "";

function callHealthcoin(command, res, handler){
    var args = Array.prototype.slice.call(arguments, 3); // Args a after the 3rd function parameter
    var callargs = args.concat([handler.bind({res:res})]); // Add the handler function to args
    //console.log("DEBUG: command:"+command+" args:"+args);
    return healthcoin[command].apply(healthcoin, callargs);
}

function healthcoinHandler(err, result){
    //console.log("DEBUG: err:"+err+" result:"+result);
    var response = {
        error: JSON.parse(err ? err.message : null),
        result: result
    };
    // res will be empty if it came from another module via healthcoinObj (i.e. passport.js).
    if (typeof this.res.send !== 'undefined' && this.res.send){
        this.res.send(JSON.stringify(response));
    } else {
        healthcoinObj.response = response.result;
    }
}

healthcoinObj.callHealthcoin    = callHealthcoin;
healthcoinObj.healthcoinHandler = healthcoinHandler;
module.exports = healthcoinObj;

// DB/Auth
//var configDB = require('./healthcoin/database.js');
//mongoose.connect(configDB.url);
mongoose.connect('mongodb://' + mdbHost + ':' + mdbPort + '/healthcoin');
require('./routes/auth.js')(app, passport); // Auth routes (includes: '/', '/signup', '/login', '/logout', '/profile', + oauth routes).
require('./healthcoin/passport')(passport); // Requires healthcoinObj to be exported first.

// CORS headers
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// Non-RPC routes //

// Returns true if the RPC node is localhost.
app.get('/islocal', function(req,res){
    var response = {
        error: null,
        result: isLocal
    };
    res.send(JSON.stringify(response));
});

// Returns user account and address.
app.get('/getuseraccount', function(req,res){
    var response = {
        error: null,
        result: { account: healthcoinObj.hcn_account, address: healthcoinObj.hcn_address }
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
    if (account.length > 1)
        callHealthcoin('listTransactions', res, healthcoinHandler, account, count, from);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

// Force new addresses to have an account
app.get('/getnewaddress/:account', function(req, res){
    var account = req.params.account || '*';
    if(account.length > 1)
        callHealthcoin('getnewaddress', res, healthcoinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/sendtoaddress/:toaddress/:amount', function(req, res){
    var amount = parseFloat(req.params.amount);
    callHealthcoin('sendtoaddress', res, healthcoinHandler, req.params.toaddress, amount);
});

app.get('/encryptwallet/:passphrase', function(req,res){
    callHealthcoin('encryptwallet', res, healthcoinHandler, req.params.passphrase);
});

app.get('/walletpassphrase/:passphrase?/:timeout?/:stakingonly?', function(req,res){
    var stakingOnly = req.params.stakingonly === 'true',
        timeout = parseInt(req.params.timeout),
        passphrase = decodeURIComponent(req.params.passphrase);
    if (passphrase){
        callHealthcoin('walletpassphrase', res, healthcoinHandler, req.params.passphrase, timeout, stakingOnly);
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
    healthcoin.getaccount(req.params.address, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/getbalance', function(req, res){
    healthcoin.getbalance(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/listaddressgroupings', function(req, res){
    healthcoin.listaddressgroupings(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/sendfrom/:fromaccount/:toaddress/:amount', function(req, res){
    healthcoin.sendfrom(req.params.fromaccount, req.params.toaddress, parseInt(req.params.amount), function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/setaccount/:address/:account', function(req, res){
    healthcoin.setaccount(req.params.address, req.params.account, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/setadressbookname/:address/:label', function(req, res){
    healthcoin.setadressbookname(req.params.address, req.params.label, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

// Custom routes //

app.get('/totalhealthcoin', function(req, res){
    healthcoin.getinfo(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else{
            var money = result.moneysupply.toString();	
            res.send(money);
        }
    });
});

app.get('/blockcount', function(req,res){
    healthcoin.getinfo(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else{
            var blocks = result.blocks.toString();
            res.send(blocks);
        }
    });
});

app.get('/difficulty', function(req,res){
    healthcoin.getDifficulty(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(result);
    });
});	

app.get('/getblockhash/:index', function(req, res){
    healthcoin.getblockhash(parseInt(req.params.index), function(err, hash){
        if(err)
            res.send(err);
        else
            res.send(hash);
    });
});

app.get('/getblock/:hash', function(req, res){
    healthcoin.getblock(req.params.hash, function(err, data){
        if(err)
            res.send(err);
        else
            res.render('block', data);
    });
});

app.get('/gettx/:txid', function(req, res){
    healthcoin.gettransaction(req.params.txid, function(err, data){
        if(err)
            res.send("Error parsing transaction id");
        else
            res.render('tx', data);
    });
});

app.get('/getpeers', function(req, res){
    healthcoin.getpeers(function(err, result){
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

// Start it up!
function startHealthcoin(app) {
    // Start the Healthcoin Express server
    console.log('Healthcoin Express server starting');
    var server = http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
}

startHealthcoin(app);
