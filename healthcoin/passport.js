var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

var User       = require('./user');
var configAuth = require('./auth');
var bcrypt = require("bcryptjs");
var validator = require('validator');

var HCN = require('../app.js');

module.exports = function(passport) {

	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});

	passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done){
		var name = req.body.name;
		var passwordRepeat = req.body.passwordRepeat;

		if (validator.isEmpty(name) || !validator.isAscii(name)){
			return done(null, false, req.flash('signupMessage', 'Name is not valid. Please try again.'));
		}
		if (!validator.isEmail(email)){
			return done(null, false, req.flash('signupMessage', 'That does not appear to be a valid email address.'));
		}
		if (!validator.isByteLength(password, {min:8, max:255})){
			return done(null, false, req.flash('signupMessage', 'The password should be at least 8 alpha-numeric characters.'));
		}
		if (validator.isAlpha(password)){ // Numbers required
			return done(null, false, req.flash('signupMessage', 'The password should contain numbers and special characters.'));
		}
		if (password !== passwordRepeat){
			return done(null, false, req.flash('signupMessage', 'The passwords do not match.'));
		}
		email = validator.normalizeEmail(email);

		var hcn_account = email;
		var hcn_address = "";

		HCN.Api.exec('getnewaddress', hcn_account, function(err, res){
			//console.log("DEBUG: err:" + err + " res:" + res);
			hcn_address = res || err;
			});

        setTimeout(function(){
		process.nextTick(function(){
			if (hcn_address === ""){
				return done(null, false, req.flash('signupMessage', 'There was an error creating your account. Please try again later.'));
			}
			User.findOne({'local.username': email}, function(err, user){
				if(err)
					return done(err);
				if(user){
					return done(null, false, req.flash('signupMessage', 'You already have an account. Please login, instead.'));
				} else {
					var newUser = new User();
					newUser.local.username = email;
					newUser.local.password = newUser.local.generateHash(password);
					newUser.local.changeme = false;
					newUser.profile.role = "User";
					newUser.profile.name = name;
					newUser.profile.email = email;
					newUser.profile.description = "";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.wallet.hcn_node_id = HCN.Api.get('host');
					newUser.wallet.hcn_account = hcn_account;
					newUser.wallet.hcn_address = hcn_address;

					newUser.save(function(err){
						if(err)
							throw err;
						// Set globally
						HCN.User = newUser;
						return done(null, newUser);
					});
				}
			});
		});
        },1234); // end timeout
	}));

	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done){
			// Allow for non-email logins (ie. MasterAccount)
			if (validator.isEmail(email))
				email = validator.normalizeEmail(email);
			process.nextTick(function(){
				User.findOne({ 'local.username': email}, function(err, user){
					if(err)
						return done(err);
					if(!user)
						return done(null, false, req.flash('loginMessage', 'No user account found.'));
					if(!user.validPassword(password)){
						return done(null, false, req.flash('loginMessage', 'Invalid password.'));
					}
					// Set globally
					if(password === 'password'){
						user.local.changeme = true;
						user.save(function(err){
							if(err)
								throw err;
						});
					}
					HCN.User = user;
					return done(null, user);
				});
			});
		}
	));

	passport.use('local-password', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done){
			var passwordNew = req.body.passwordNew || "";
			var passwordNewRepeat = req.body.passwordNewRepeat || "";
			if (typeof HCN.User.local === 'undefined'){
				return done(null, false, req.flash('passwordMessage', 'Please login first.'));
			}
			if (email !== HCN.User.local.username){
				return done(null, false, req.flash('passwordMessage', 'Please try again?'));
			}
			if (!validator.isByteLength(passwordNew, {min:8, max:255})){
				return done(null, false, req.flash('passwordMessage', 'The new password should be at least 8 alpha-numeric characters.'));
			}
			if (validator.isAlpha(passwordNew)){ // Numbers required
				return done(null, false, req.flash('passwordMessage', 'The new password should contain numbers and special characters.'));
			}
			if (password === passwordNew){
				return done(null, false, req.flash('passwordMessage', 'The new password must be different.'));
			}
			if (passwordNew !== passwordNewRepeat){
				return done(null, false, req.flash('passwordMessage', 'The new passwords do not match.'));
			}

			process.nextTick(function(){
				User.findOne({'local.username': email}, function(err, user){
					if(err)
						return done(err);

					if(!user){
						return done(null, false, req.flash('passwordMessage', 'You do not have an account. Please signup, instead.'));
					} else {
						bcrypt.compare(password, user.local.password, function (err, match){
							if (err)
								return done(err);

							if (!match){
								return done(null, false, req.flash('passwordMessage', 'Your old password is invalid.'));
							} else {
								user.local.password = user.local.generateHash(passwordNew);
								user.local.changeme = false;

								user.save(function(err){
									if(err)
										throw err;
									// Set globally
									HCN.User = user;
									return done(null, user);
								});
							}
						});
					}
				});
			});
		}
	));

	passport.use(new FacebookStrategy({
	    clientID: configAuth.facebookAuth.clientID,
	    clientSecret: configAuth.facebookAuth.clientSecret,
	    callbackURL: configAuth.facebookAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
			var	email = "";
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}

			var hcn_account = profile.id;
			var hcn_address = "";

			HCN.Api.exec('getnewaddress', hcn_account, function(err, res){
				//console.log("DEBUG: err:" + err + " res:" + res);
				hcn_address = res || err;
				});

			setTimeout(function(){
	    	process.nextTick(function(){
	    		User.findOne({'facebook.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
						HCN.User = user;
	    				return done(null, user); // User found
	    			}
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.facebook.id = profile.id;
	    				newUser.facebook.token = accessToken;
						newUser.profile.role = "User";
	    				newUser.profile.name = profile.displayName;
	    				newUser.profile.email = email;
						newUser.profile.description = "";
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
							HCN.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	        },1234); // end timeout
	    }
	));

	passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
			var	email = "";
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}

			var hcn_account = profile.id;
			var hcn_address = "";

			HCN.Api.exec('getnewaddress', hcn_account, function(err, res){
				//console.log("DEBUG: err:" + err + " res:" + res);
				hcn_address = res || err;
				});

			setTimeout(function(){
	    	process.nextTick(function(){
	    		User.findOne({'google.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
						HCN.User = user;
	    				return done(null, user); // User found
	    			}
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.google.id = profile.id;
	    				newUser.google.token = accessToken;
						newUser.profile.role = "User";
	    				newUser.profile.name = profile.displayName;
	    				newUser.profile.email = email;
						newUser.profile.description = "";
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
							HCN.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	        },1234); // end timeout
	    }
	));

	passport.use(new TwitterStrategy({
	    consumerKey: configAuth.twitterAuth.consumerKey,
	    consumerSecret: configAuth.twitterAuth.consumerSecret,
	    callbackURL: configAuth.twitterAuth.callbackURL
	  },
	  function(token, tokenSecret, profile, done) {
			var	email = "";
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}

			var hcn_account = profile.id;
			var hcn_address = "";

			HCN.Api.exec('getnewaddress', hcn_account, function(err, res){
				//console.log("DEBUG: err:" + err + " res:" + res);
				hcn_address = res || err;
				});

			setTimeout(function(){
	    	process.nextTick(function(){
	    		User.findOne({'twitter.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
						HCN.User = user;
	    				return done(null, user); // User found
	    			}
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.twitter.id = profile.id;
	    				newUser.twitter.token = token;
						newUser.profile.role = "User";
	    				newUser.profile.name = profile.displayName;
	    				newUser.profile.email = email;
						newUser.profile.description = "";
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
							HCN.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	        },1234); // end timeout
	    }
	));
};
