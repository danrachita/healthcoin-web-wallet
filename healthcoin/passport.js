var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

var User       = require('./user');
var configAuth = require('./auth');

var validator = require('validator');

module.exports = function(healthcoinObj, passport) {

	//var healthcoinObj = require('../app.js');
	var callHealthcoin = healthcoinObj.callHealthcoin;
	var healthcoinHandler = healthcoinObj.healthcoinHandler;

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
		if (!validator.isEmail(email)){
			return done(null, false, req.flash('signupMessage', 'That does not appear to be a valid email address. Please try again.'));
		}
		if (!validator.isByteLength(password, {min:8, max:255})){
			return done(null, false, req.flash('signupMessage', 'The password should be at least 8 characters. Please try again.'));
		}
		email = validator.normalizeEmail(email);
		var res = {}, // Set res to empty object so healthcoinHandler knows it's not from express http.
			hcn_account = email;
		callHealthcoin('getnewaddress', res, healthcoinHandler, hcn_account);
		var hcn_address = healthcoinObj.response; // Response set by healthcoinHandler;
		if (hcn_address === ""){
			return done(null, false, req.flash('signupMessage', 'There was an error creating your account. Please try again later.'));
		}
		process.nextTick(function(){
			User.findOne({'local.username': email}, function(err, user){
				if(err)
					return done(err);
				if(user){
					return done(null, false, req.flash('signupMessage', 'You already have an account. Please login, instead.'));
				} else {
					var newUser = new User();
					newUser.local.username = email;
					newUser.local.password = newUser.profile.generateHash(password);
					newUser.profile.role = "User";
					newUser.profile.name = "New User";
					newUser.profile.email = email;
					newUser.profile.description = "";
					newUser.profile.age = "";
					newUser.profile.weight = "";
					newUser.profile.gender = "";
					newUser.profile.ethnicity = "";
					newUser.wallet.hcn_node_id = healthcoinObj.rpcHost;
					newUser.wallet.hcn_account = hcn_account;
					newUser.wallet.hcn_address = hcn_address;

					newUser.save(function(err){
						if(err)
							throw err;
						// Set globally
						newUser.local.password = "XXXXXXXX";
						healthcoinObj.User = newUser;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done){
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
	    			user.local.password = "XXXXXXXX";
					healthcoinObj.User = user;
					return done(null, user);
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
			var res = {}, // Set res to empty object so healthcoinHandler knows it's not from express http
				email = "",
				hcn_account = profile.id;
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}
			callHealthcoin('getnewaddress', res, healthcoinHandler, hcn_account);
			var hcn_address = healthcoinObj.response; // Response set by healthcoinHandler;
			if (hcn_address === ""){
				return done(null, false, null);
			}
	    	process.nextTick(function(){
	    		User.findOne({'facebook.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
		    			user.facebook.token = "XXXXXXXX";
						healthcoinObj.User = user;
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
						newUser.wallet.hcn_node_id = healthcoinObj.rpcHost;
						newUser.wallet.hcn_account = hcn_account;
						newUser.wallet.hcn_address = hcn_address;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
							// Set globally
		    				newUser.facebook.token = "XXXXXXXX";
							healthcoinObj.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }
	));

	passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
			var res = {}, // Set res to empty object so healthcoinHandler knows it's not from express http.
				email = "",
				hcn_account = profile.id;
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}
			callHealthcoin('getnewaddress', res, healthcoinHandler, hcn_account);
			var hcn_address = healthcoinObj.response; // Response set by healthcoinHandler;
			if (hcn_address === ""){
				return done(null, false, null);
			}
	    	process.nextTick(function(){
	    		User.findOne({'google.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
	    				user.google.token = "XXXXXXXX";
						healthcoinObj.User = user;
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
						newUser.wallet.hcn_node_id = healthcoinObj.rpcHost;
						newUser.wallet.hcn_account = hcn_account;
						newUser.wallet.hcn_address = hcn_address;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
							// Set globally
		    				newUser.google.token = "XXXXXXXX";
							healthcoinObj.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }
	));

	passport.use(new TwitterStrategy({
	    consumerKey: configAuth.twitterAuth.consumerKey,
	    consumerSecret: configAuth.twitterAuth.consumerSecret,
	    callbackURL: configAuth.twitterAuth.callbackURL
	  },
	  function(token, tokenSecret, profile, done) {
			var res = {}, // Set res to empty object so healthcoinHandler knows it's not from express http.
				email = "",
				hcn_account = profile.id;
			if (typeof profile.emails !== 'undefined' && profile.emails[0]){
				email = validator.normalizeEmail(profile.emails[0].value);
			}
			callHealthcoin('getnewaddress', res, healthcoinHandler, hcn_account);
			var hcn_address = healthcoinObj.response; // Response set by healthcoinHandler;
			if (hcn_address === ""){
				return done(null, false, null);
			}
	    	process.nextTick(function(){
	    		User.findOne({'twitter.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user){
						// Set globally
		    			user.twitter.token = "XXXXXXXX";
						healthcoinObj.User = user;
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
						newUser.wallet.hcn_node_id = healthcoinObj.rpcHost;
						newUser.wallet.hcn_account = hcn_account;
						newUser.wallet.hcn_address = hcn_address;

	    				newUser.save(function(err){
							if(err)
								throw err;
							// Set globally
		    				newUser.twitter.token = "XXXXXXXX";
							healthcoinObj.User = newUser;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }
	));
};
