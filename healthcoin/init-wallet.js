var User       = require('./user');
var validator = require('validator');

function Init() {

	var HCN = require('../app.js');
	var foundNode_ID = false;

	User.findOne({'local.username': HCN.MasterAccount, 'wallet.node_id': HCN.MasterNode_ID}, function(err, user){
		if (user)
			foundNode_ID = true;
	});


	User.findOne({'local.username': HCN.MasterAccount}, function(err, user){
		if(err)
			return err;
		if(user && !foundNode_ID){
            var found = false;
			// Get the address for the node_id
			var wallet = user.wallet.filter(function(wal){
				if(!found && wal.node_id === HCN.MasterNode_ID){
                    found = true;
                    HCN.MasterAddress = wal.address;
					return wal;
				}
			});
			if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + HCN.MasterNode_ID);

			HCN.MasterPassword = "XXXXXXXX";
		} else {
			// Lots of synchronous stuff needs to be done at first setup. TODO: Convert to async functions.
			var done1 = 10, done2 = 20, done3 = 30;
			var hcn_addresses = [];
			HCN.Api.exec('getaddressesbyaccount', HCN.MasterAccount, function(err, res){
				//console.log("DEBUG: err:" + err + " res:" + res);
				hcn_addresses = res;
				done1 = 0;
				});
			var interval1 = setInterval(function(){
				if (!done1){
					clearInterval(interval1);

					if (!hcn_addresses.length){
						// MasterAccount has not been labeled in wallet. Get all un-labeled addresses.
						HCN.Api.exec('getaddressesbyaccount', "", function(err, res){
							//console.log("DEBUG: err:" + err + " res:" + res);
							hcn_addresses = res;
							done2 = 0;
							});
						var interval2 = setInterval(function(){
							if (!done2){
								clearInterval(interval2);

								// Foreach address: setaccount <address> <acccount>
								for (var k in hcn_addresses){
									// Make sure we have a Healthcoin address.
									// NOTE: The rpc command setaccount has a "bug" that creates an unlabeled address after executing.
									//       You have to go into the Qt wallet to label it. TODO: Fix rpc command.
									if (hcn_addresses.hasOwnProperty(k) && hcn_addresses[k].substring(0,1) === 'H'){
										HCN.Api.exec('setaccount', hcn_addresses[k], HCN.MasterAccount, function(err, res){
											if (err) console.log("Error: err:" + err + " res:" + res);
											if (done3){
												HCN.MasterAddress = hcn_addresses[0]; // Use first address
												done3 = 0;
											}
											});
									}
								}
							} else { done2--; }
						},1000); // end timeout
					} else {
						// Make sure we have a Healthcoin address.
						HCN.MasterAddress = hcn_addresses[0].substring(0,1) === 'H' ? hcn_addresses[0] : ""; // Use first address
						done3 = 0;
					}
				} else { done1--; }
			},1000); // end timeout

			var interval3 = setInterval(function(){
				console.log("DEBUG: done1,2,3:" + done1 + "," + done2 + "," + done3 + " MasterAddress:" + HCN.MasterAddress);
				if (!done3 && !user){
					clearInterval(interval3);
					// Create the MasterAccount
					var newUser = new User();
					newUser.local.username = HCN.MasterAccount;
					newUser.local.password = newUser.local.generateHash(HCN.MasterPassword);
					newUser.local.changeme = HCN.MasterPassword === "password" ? true : false;
					newUser.profile.role = "Admin";
					newUser.profile.name = "Healthcoin Admin";
					newUser.profile.email = HCN.MasterEmail;
					newUser.profile.description = "Keeper of Coins";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.wallet.push( { node_id: HCN.MasterNode_ID, account: HCN.MasterAccount, address: HCN.MasterAddress });
	
					newUser.save(function(err){
						if(err)
							throw err;
						// Set globally
						HCN.MasterPassword = "XXXXXXXX";
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
