var User       = require('./user');
var validator = require('validator');

function Init() {

	var coin = require('../app.js');
	var foundNode_ID = false;
	var masterAddress = "";

	User.findOne({'local.id': coin.settings.masterAccount, 'wallet.node_id': coin.rpcHost}, function(err, user){
		if (user)
			foundNode_ID = true;
	});


	User.findOne({'local.id': coin.settings.masterAccount}, function(err, user){
		if(err)
			return err;
		if(user && !foundNode_ID){
			// Get the address for the node_id
			var wallet = user.wallet.filter(function(wal){
				if(wal.node_id && wal.node_id === coin.rpcHost){
                    masterAddress = wal.address;
					return wal;
				}
			});
			if (!wallet)
                console.log("Error: wallet not found: " + JSON.stringify(wallet));
		} else {
			// Lots of synchronous stuff needs to be done at first startup.
			var done1 = 10, done2 = 20, done3 = 30;
			var addresses = [];
			coin.api.exec('getaddressesbyaccount', coin.settings.masterAccount, function(err, res){
				addresses = res;
				done1 = 0;
				});
			var interval1 = setInterval(function(){
				if (!done1){
					clearInterval(interval1);

					if (!addresses || !addresses.length){
						// masterAccount has not been labeled in wallet. Get all un-labeled addresses.
						coin.api.exec('getaddressesbyaccount', "", function(err, res){
							addresses = res;
							done2 = 0;
							});
						var interval2 = setInterval(function(){
							if (!done2){
								clearInterval(interval2);

								// If the node is down, addresses will be null and done3 will be 30.
								if (addresses && addresses.length){
									// Foreach address: setaccount <address> <acccount>
									for (var k in addresses){
										// Make sure we have an address.
										// NOTE: The rpc command setaccount has a "bug" that creates an unlabeled address after executing.
										//       You have to go into the Qt wallet to label it. TODO: Fix rpc command.
										if (addresses.hasOwnProperty(k) && addresses[k].substring(0,1) === 'H'){
											coin.api.exec('setaccount', addresses[k], coin.settings.masterAccount, function(err, res){
												if (err) console.log("Error: err:" + err + " res:" + res);
												if (done3){
													masterAddress = addresses[0]; // Use first address
													done3 = 0;
												}
												});
										}
									}
								} else {
									// Node is down and DB is up.
									user = null;
								}
							} else { done2--; }
						},1000); // end timeout
					} else {
						// Make sure we have an address.
						masterAddress = addresses[0].substring(0,1) === 'H' ? addresses[0] : ""; // Use first address
						done3 = 0;
					}
				} else { done1--; }
			},1000); // end timeout

			var interval3 = setInterval(function(){
				//console.log("DEBUG: done1,done2,done3: " + done1 + "," + done2 + "," + done3 + " masterAddress: " + masterAddress);
				if (!done3 && !user){
					clearInterval(interval3);
					// Create the masterAccount
					var newUser = new User();
					newUser.local.id = coin.settings.masterAccount;
					newUser.local.password = newUser.local.generateHash("password");
					newUser.local.changeme = true;
					newUser.profile.login_type = "local";
					newUser.profile.last_login = Date.now();
					newUser.profile.role = "Admin";
					newUser.profile.name = "Admin";
					newUser.profile.email = coin.settings.masterEmail;
					newUser.profile.description = "Keeper of Coins";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.waist = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.profile.country = "";
                    newUser.profile.credit = 0;
					newUser.wallet.push( { node_id: coin.rpcHost, account: coin.settings.masterAccount, address: masterAddress });
	
					newUser.save(function(err){
						if(err)
							throw err;
						return;
					});
				} else {
					if (user){
						clearInterval(interval3);
					}
					done3--;
				}
			},1000); // end timeout
		}
	});
}

module.exports = function() {
    Init();
};
