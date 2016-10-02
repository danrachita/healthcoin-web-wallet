var gui = require("nw.gui");

// Get the current window
var win = gui.Window.get();

// Extend application menu for Mac OS
if (process.platform == "darwin") {
	var menu = new gui.Menu({type: "menubar"});
	menu.createMacBuiltin && menu.createMacBuiltin(window.document.title);
	gui.Window.get().menu = menu;
}

window.onload = function() {
  console.log("Starting Healthcoin...");

	/* Healthcoin-web-wallet does not start a local instance of healthcoind.
  console.log("Starting healthcoind Process...");
  //startHCN();
  if (process.platform == 'darwin') { //If Mac OS X
  	filepath = process.env.HOME + '/Library/Application Support/Healthcoin/healthcoin.conf';
	  ExecuteProcess('healthcoin/osx/healthcoind','-conf=' + filepath);
	} else if (process.platform == 'linux') { //If Linux
    filepath = process.env.HOME + '/.healthcoin/healthcoin.conf';
	  ExecuteProcess('healthcoin/linux/healthcoind','-conf=' + filepath);
	} else { //Else it's Windows
    filepath = process.env.APPDATA + '/Healthcoin/healthcoin.conf';
    if ( process.arch == 'x64' ) { //If Windows 64bit
      ExecuteProcess('healthcoin/win64/healthcoind.exe','-conf=' + filepath);
    }
    else { //Else it's Windows 32bit
     ExecuteProcess('healthcoin/win32/healthcoind.exe','-conf=' + filepath); 
    }
	}
  console.log("healthcoind Started.");
  */

	var count = 0;
	function timeout() {
		setTimeout(function () {
			count += 1;
			console.log('CHECKED HCN RPC FOR: ' + count);
			check_healthcoinrpc_connection();
			if (count <= 29) {
				timeout();
			} else {
				console.log ('HCN RPC CONNECTED!!!!....');
				setTimeout(function () { window.location.replace("http://127.0.0.1:8181"); }, 8000);
			}
		}, 3000);
	}
	
	timeout();
	
	function check_healthcoinrpc_connection() {
		var healthcoin=require("./healthcoinapi");
		healthcoin.getinfo(function(err,result) {
			if(err) {
				//handle the error
				console.log('ERROR CONNECTING HCN RPC');
			}
			else {
				//success!
				console.log('HCN RPC CONNECTED!');
				count = 30;
			}
		});
	}

  updateContentStyle();
  gui.Window.get().show();
};

win.on('close', function() {
  this.hide(); // Pretend to be closed already
	/* Healthcoin-web-wallet does not stop a local instance of healthcoind.
  console.log("Stopping healthcoind Process...");
  //stopHCN();
    if (process.platform == 'darwin') { //If Mac OS X
	ExecuteProcess('pkill','healthcoind');
	} else if (process.platform == 'linux') { //If Linux
	ExecuteProcess('pkill','healthcoind');
	} else { //Else it's Windows
    ExecuteProcess('taskkill','/im healthcoind.exe');
	}
	*/
  console.log("Closing app...");
  this.close(true);
});

//Start Process by passing executable and its attribute.
function ExecuteProcess(prcs,atrbs) {
  var spawn = require('child_process').spawn,
  HealthcoinExec = spawn(prcs, [atrbs]);
  HealthcoinExec.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  
  HealthcoinExec.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  
  HealthcoinExec.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}
