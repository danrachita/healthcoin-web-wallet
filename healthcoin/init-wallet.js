var User       = require('./user');
var validator = require('validator');

function Init() {

	var HCN = require('../app.js');
	var foundNode_ID = false;

	User.findOne({'local.id': HCN.masterAccount, 'wallet.node_id': HCN.rpcHost}, function(err, user){
		if (user)
			foundNode_ID = true;
	});


	User.findOne({'local.id': HCN.masterAccount}, function(err, user){
		if(err)
			return err;
		if(user && !foundNode_ID){
            var found = false;
			// Get the address for the node_id
			var wallet = user.wallet.filter(function(wal){
				if(!found && wal.node_id === HCN.rpcHost){
                    found = true;
                    HCN.masterAddress = wal.address;
					return wal;
				}
			});
			if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + HCN.rpcHost);

			HCN.masterPassword = "XXXXXXXX";
		} else {
			// Lots of synchronous stuff needs to be done at first startup.
			var done1 = 10, done2 = 20, done3 = 30;
			var hcn_addresses = [];
			HCN.api.exec('getaddressesbyaccount', HCN.masterAccount, function(err, res){
				//console.log("DEBUG: err:" + err + " res:" + res);
				hcn_addresses = res;
				done1 = 0;
				});
			var interval1 = setInterval(function(){
				if (!done1){
					clearInterval(interval1);

					if (!hcn_addresses || !hcn_addresses.length){
						// masterAccount has not been labeled in wallet. Get all un-labeled addresses.
						HCN.api.exec('getaddressesbyaccount', "", function(err, res){
							//console.log("DEBUG: err:" + err + " res:" + res);
							hcn_addresses = res;
							done2 = 0;
							});
						var interval2 = setInterval(function(){
							if (!done2){
								clearInterval(interval2);

								// If the node is down, hcn_addresses will be null and done3 will be 30.
								if (hcn_addresses && hcn_addresses.length){
									// Foreach address: setaccount <address> <acccount>
									for (var k in hcn_addresses){
										// Make sure we have a Healthcoin address.
										// NOTE: The rpc command setaccount has a "bug" that creates an unlabeled address after executing.
										//       You have to go into the Qt wallet to label it. TODO: Fix rpc command.
										if (hcn_addresses.hasOwnProperty(k) && hcn_addresses[k].substring(0,1) === 'H'){
											HCN.api.exec('setaccount', hcn_addresses[k], HCN.masterAccount, function(err, res){
												if (err) console.log("Error: err:" + err + " res:" + res);
												if (done3){
													HCN.masterAddress = hcn_addresses[0]; // Use first address
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
						// Make sure we have a Healthcoin address.
						HCN.masterAddress = hcn_addresses[0].substring(0,1) === 'H' ? hcn_addresses[0] : ""; // Use first address
						done3 = 0;
					}
				} else { done1--; }
			},1000); // end timeout

			var interval3 = setInterval(function(){
				//console.log("DEBUG: done1,2,3:" + done1 + "," + done2 + "," + done3 + " masterAddress:" + HCN.masterAddress);
				if (!done3 && !user){
					clearInterval(interval3);
					// Create the masterAccount
					var newUser = new User();
					newUser.local.id = HCN.masterAccount;
					newUser.local.password = newUser.local.generateHash(HCN.masterPassword);
					newUser.local.changeme = HCN.masterPassword === "password" ? true : false;
					newUser.profile.login_type = "local";
					newUser.profile.last_login = Date.now();
					newUser.profile.role = "Admin";
					newUser.profile.name = "Healthcoin Admin";
					newUser.profile.email = HCN.masterEmail;
					newUser.profile.description = "Keeper of Coins";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.waist = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.profile.country = "";
                    newUser.profile.credit = 0;
					newUser.wallet.push( { node_id: HCN.rpcHost, account: HCN.masterAccount, address: HCN.masterAddress });
	
					newUser.save(function(err){
						if(err)
							throw err;
						// Set globally
						HCN.masterPassword = "XXXXXXXX";
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
