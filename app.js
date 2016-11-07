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
var atob = require('atob');
var btoa = require('btoa');
var app = express();

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var healthcoinApi = require('./healthcoin/healthcoinapi');

// All environments
app.use(cors());
app.set('port', process.env.PORT || 8181);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// HCN Object exported for client access
var HCN     = {};
HCN.Api     = healthcoinApi.healthcoin; // healthcoin opts and calls
HCN.isAlive = healthcoinApi.isAlive; // TODO: Add isAlive() to healthcoinApi and abort here if not!
HCN.isLocal = healthcoinApi.isLocal; // TODO: Move all these to opts.
HCN.mdbHost = healthcoinApi.mdbHost; // "
HCN.mdbPort = healthcoinApi.mdbPort; // "

if (HCN.isLocal){
    HCN.appHost = '127.0.0.1';
} else {
    HCN.appHost = 'nequals1.io';
}
app.set('host', HCN.appHost);
HCN.appPort = app.get('port');

HCN.MasterNode_ID  = HCN.Api.get('host');         // Master UI login account, and Label to assign to "" account(s).
HCN.MasterAccount  = "MASTER_ACCOUNT";            // Master UI login account, and Label to assign to "" account(s).
HCN.MasterAddress  = "";                          // Master Wallet Address to move coin from (assigned in init-wallet)
HCN.MasterEmail    = "healthcoin@" + HCN.appHost; // Master email account.
HCN.MasterPassword = "password";                  // Master UI password (not encryption password). (FORCED TO CHANGE IF 'password'.)
HCN.NewUserAmount  = 1.0;                         // Aount to send new users at sign-up.
HCN.MaxSendAmount  = 1000.0;                       // Normal send amounts from MasterAccount should be small.
HCN.User           = {};

module.exports = HCN;
// End HCN

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

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(bodyParser.json());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// DB/Auth Functions
mongoose.connect('mongodb://' + HCN.mdbHost + ':' + HCN.mdbPort + '/healthcoin');
require('./healthcoin/init-wallet')();      // Requires HCN
require('./routes/auth.js')(app, passport); // Auth routes (includes: '/', '/signup', '/login', '/logout', '/profile', '/password', + oauth routes).
require('./healthcoin/passport')(passport); // Requires HCN

var MDB = require('./healthcoin/database');
var Biomarkers = require('./healthcoin/biomarkers');

// Add CORS headers to all requests
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


function callHealthcoin(command, res, handler){
    var args = Array.prototype.slice.call(arguments, 3);   // Args are after the 3rd function parameter
    var callargs = args.concat([handler.bind({res:res})]); // Add the handler function to args
    //console.log("DEBUG: command:"+command+" args:"+args);
    return HCN.Api[command].apply(HCN.Api, callargs);
}
function healthcoinHandler(err, result){
    //console.log("DEBUG: err:"+err+" result:"+result);
    var response = {
        error: JSON.parse(err ? err.message : null),
        result: result
    };
    if (typeof this.res.send !== 'undefined' && this.res.send){
        this.res.send(JSON.stringify(response));
    }
}


// Non-RPC routes //

// Returns true if the RPC node is localhost.
app.get('/islocal', function(req,res){
    var response = {
        error: null,
        result: HCN.isLocal
    };
    res.send(JSON.stringify(response));
});

// Returns this rpc wallet node.
app.get('/getwalletnodeid', function(req,res){
    var response = {
        error: null,
        result: HCN.Api.get('host')
    };
    res.send(JSON.stringify(response));
});

// Returns user account and address.
app.get('/getuseraccount', function(req,res){
    var response = {
        error: null,
        result: { User: HCN.User }
    };
    res.send(JSON.stringify(response));
});

// Saves user profile.
app.get('/saveuserprofile/:profile', function(req,res){
    var profile = JSON.parse(atob(decodeURIComponent(req.params.profile))) || HCN.User.profile,
        result = null;
    if (profile && profile.login_type){
        HCN.User.profile = profile;
        result = MDB.saveUserProfile(HCN.User._id, profile);
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
        if (account === HCN.MasterAccount) account = "*";
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
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || '';
    var commentto = req.params.commentto || '';
    var txcomment = atob(decodeURIComponent(req.params.txcomment)) || '';
    if(fromaccount.length > 1 && toaddress.length > 1 && amount > 0 && amount <= HCN.MaxSendAmount){
        if (comment === "HCBM" && txcomment !== ''){
            // Add user's biomarker using schema and encode back to hcbm:txcomment before sending.
            var txcommentObj = JSON.parse(txcomment) || {};
            var Biomarker = new Biomarkers().buildBiomarker(amount, HCN.User._id, txcommentObj);
            txcomment = "hcbm:" + btoa(JSON.stringify(Biomarker));
            callHealthcoin('sendfrom', res, healthcoinHandler, fromaccount, toaddress, amount, minconf, comment, commentto, txcomment);
        } else {
            callHealthcoin('sendfrom', res, healthcoinHandler, fromaccount, toaddress, amount);
        }
    } else {
        if (amount > HCN.MaxSendAmount)
            res.send(JSON.stringify("Error: Amount is greater than the maximum of " + HCN.MaxSendAmount + "."));
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
    var minconf = parseInt(req.params.minconf || 1);
    var comment = req.params.comment || ''; // Not txcomment
    if(fromaccount.length > 1 && toaccount.length > 1 && amount > 0 && amount < HCN.MaxSendAmount)
        callHealthcoin('move', res, healthcoinHandler, fromaccount, toaccount, amount, minconf, comment);
    else
        res.send(JSON.stringify("Error: Invalid move."));
});

// New addresses must have an account
app.get('/getnewaddress/:account', function(req, res){
    var account = req.params.account || '*';
    if(account.length > 1)
        callHealthcoin('getnewaddress', res, healthcoinHandler, account);
    else
        res.send(JSON.stringify("Error: Invalid Account."));
});

app.get('/setaccount/:address/:account', function(req, res){
    HCN.Api.setaccount(req.params.address, req.params.account, function(err, result){
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
    HCN.Api.getaccount(req.params.address, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/listaddressgroupings', function(req, res){
    HCN.Api.listaddressgroupings(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

app.get('/setadressbookname/:address/:label', function(req, res){
    HCN.Api.setadressbookname(req.params.address, req.params.label, function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(JSON.stringify(result));
    });
});

// Custom routes //

app.get('/totalhealthcoin', function(req, res){
    HCN.Api.getinfo(function(err, result){
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
    HCN.Api.getinfo(function(err, result){
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
    HCN.Api.getDifficulty(function(err, result){
        console.log("err:"+err+" result:"+result);
        if(err)
            res.send(err);
        else
            res.send(result);
    });
});	

app.get('/getblockhash/:index', function(req, res){
    HCN.Api.getblockhash(parseInt(req.params.index), function(err, hash){
        if(err)
            res.send(err);
        else
            res.send(hash);
    });
});

app.get('/getblock/:hash', function(req, res){
    HCN.Api.getblock(req.params.hash, function(err, data){
        if(err)
            res.send(err);
        else
            res.render('block', data);
    });
});

app.get('/gettx/:txid', function(req, res){
    HCN.Api.gettransaction(req.params.txid, function(err, data){
        if(err)
            res.send("Error parsing transaction id");
        else
            res.render('tx', data);
    });
});

app.get('/getpeers', function(req, res){
    HCN.Api.getpeers(function(err, result){
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
