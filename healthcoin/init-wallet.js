var User       = require('./user');
var validator = require('validator');

function Init(passport) {

	var HCN = require('../app.js');

	return; // DEBUG:

//	passport.use('local-signup', new LocalStrategy({
//		usernameField: 'email',
//		passwordField: 'password',
//		passReqToCallback: true
//	},
//	function(req, email, password, done){
		var	hcn_address = HCN.MasterAddress;
		var	hcn_account = HCN.MasterAccount;
//		process.nextTick(function(){
			User.findOne({'local.username': hcn_account}, function(err, user){
				if(err)
					return err;
				if(user){
					// Get the address
					HCN.MasterAddress = user.wallet.hcn_address;
					HCN.MasterPassword = "XXXXXXXX";
					return;
				} else {
					HCN.Api.exec('getaddressesbyaccount', hcn_account, function(err, res){
						console.log("DEBUG: err:" + err + " res:" + res);
						hcn_address = res;
						});
					if (!hcn_address || hcn_address === ""){
						// MasterAccount has not been setup.
						// TODO: Assign Account to main address.
						// getaddressesbyaccount ""
						// Foreach address: setaccount <address> <acccount>  (SEE: app.js setaccount)

						hcn_address = HCN.MasterAddress;
					} else {
						hcn_address = response[response.length -1];
					}
					response = callHealthcoin('validateaddress', res, healthcoinHandler, hcn_address);
					if (response === "" || response.isvalid === false || response.ismine === false){
						console.log("ERROR: Invalid MasterAddress! " + JSON.stringify(response));
						process.exit(1);
					}

					// Create the MasterAccount
					var newUser = new User();
					newUser.local.username = hcn_account;
					newUser.local.password = newUser.local.generateHash(HCN.MasterPassword);
					newUser.profile.role = "Admin";
					newUser.profile.name = "Healthcoin Admin";
					newUser.profile.email = HCN.MasterEmail;
					newUser.profile.description = "Keeper of Coins";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.wallet.hcn_node_id = HCN.Api.get(host);
					newUser.wallet.hcn_account = hcn_account;
					newUser.wallet.hcn_address = hcn_address;

					newUser.save(function(err){
						if(err)
							throw err;
						// Set globally
						HCN.MasterAddress = user.wallet.hcn_address;
						HCN.MasterPassword = "XXXXXXXX";
						return;
					});
				}
			});
//		});

//	}));
}

module.exports = function(passport) {
    Init(passport);
};
