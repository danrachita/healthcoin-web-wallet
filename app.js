/**
 * Module dependencies.
 */

var count = 0;
function timeout() {
    setTimeout(function () {
        count += 1;
  //console.log(count);
  if (process.platform == 'darwin') { //If Mac OS X
    ExecuteProcess('sh','./check.sh');
    } else if (process.platform == 'linux') { //If Linux
    ExecuteProcess('sh','./check.sh');
    } else { //Else it's Windows
    ExecuteProcess('check.bat','');
}
  if (count <= 3) {
        timeout();
  } else {
healthcoinapp();
  }
    }, 5000);
}

timeout();

//Start Process by passing executable and its attribute.
function ExecuteProcess(prcs,atrbs) {
  var spawn = require('child_process').spawn,
  HealthcoinExec = spawn(prcs, [atrbs]);
  HealthcoinExec.stdout.on('data', function (data) {
    //console.log('stdout: ' + data);
  if ( data === 0 ) {
  console.log('no process is running...');
  } else {
  console.log('PROCESS IS RUNNING!...');
  count = 10;
  }
  });
  
  HealthcoinExec.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  
  HealthcoinExec.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}


function healthcoinapp() {
//------- app.js CODE GOES HERE -------

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();
var healthcoin=require("./healthcoinapi");
var querystring = require('querystring');
var crypto = require('crypto');

// all environments
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

console.log('Healthcoin Node Starting');

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

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

function callHealthcoin(command, res, handler) {
    var args = Array.prototype.slice.call(arguments, 3);
    var callargs = args.concat([handler.bind({res:res})]);
    return healthcoin[command].apply(healthcoin, callargs);
}

function healthcoinHandler(err, result){
    console.log("err:"+err+" result:"+result);
    var response = {
        error: JSON.parse(err ? err.message : null),
        result: result
    };
    this.res.send(JSON.stringify(response));
}

app.get('/getinfo', function(req,res){ callHealthcoin('getInfo', res, healthcoinHandler); } );
app.get('/getinterestrate', function(req,res){ callHealthcoin('getInterestRate', res, healthcoinHandler); } );
app.get('/getinflationrate', function(req,res){ callHealthcoin('getInflationRate', res, healthcoinHandler); } );
app.get('/getblockcount', function(req,res){ callHealthcoin('getBlockCount', res, healthcoinHandler); } );
app.get('/getstakinginfo', function(req,res) { callHealthcoin('getStakingInfo', res, healthcoinHandler); } );
app.get('/getnewaddress/:account?', function(req, res){ 
    var accountName = req.params.account || '';
    callHealthcoin('getnewaddress', res, healthcoinHandler, accountName);
});

//app.get('/listtransactions', function(req, res){ callHealthcoin('listTransactions', res, healthcoinHandler, '*', 10, 0) } );

// pagination view
app.get('/listtransactions/:account?/:page?', function(req, res){
    var account = (req.params.account || '*'),
        page = (req.params.page || 1),
        count = 10,     // TODO: Parameterize this.
        from = 0;
    if (page < 1) page = 1;
    from = count * page - count;
    callHealthcoin('listTransactions', res, healthcoinHandler, account, count, from);
});

app.get('/listreceivedbyaddress/:minconf?/:includeempty?', function(req, res){
    var includeEmpty = (req.params.includeempty || false) === 'true', 
        minConf = parseInt(req.params.minconf || 1);
    callHealthcoin('listreceivedbyaddress', res, healthcoinHandler, minConf, includeEmpty);
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


//app.get('/', function(req,res){
//	res.render('index');
//	});


// RPC functions //////////////

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


app.get('/getnewaddress', function(req, res){
	healthcoin.getnewaddress(function(err, result){
		console.log("err:"+err+" result:"+result);
		if(err)
			res.send(err);
		else
			res.send(JSON.stringify(result));
	});
});

// listaccounts is broken. use listaddressgroupings
//app.get('/listaccounts', function(req, res){
//	healthcoin.listaccounts(function(err, result){
//		console.log("err:"+err+" result:"+result);
//		if(err)
//			res.send(err);
//		else
//			res.send(JSON.stringify(result));
//	});
//});

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

//sendtoaddress <Healthcoinaddress> <amount> [comment] [comment-to]
// TODO: Add optional comments
/*app.get('/sendtoaddress/:toaddress/:amount', function(req, res){
    function formatError(err){
        return err.substr(err.indexOf('{'));
    }

	healthcoin.sendtoaddress(req.params.toaddress, parseInt(req.params.amount), function(err, result){
		console.log("err:"+err+" result:"+result);
        res.send(JSON.stringify(packageResponse(err, result)));
		if(err){
			res.send(err.message);
        }
		else
			res.send(JSON.stringify(result));
        
	});
});*/

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


// Custom functions ////////////

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
	healthcoin.SuperNET('{"requestType":"getpeers"}', function(err, data){
		if(err)
			console.log("err: " + err);
		else
			res.render('getpeers',{peers:JSON.parse(data).peers});
	});
});


//------- app.js CODE ENDS -------
}
