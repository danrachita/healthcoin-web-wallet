var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

var User       = require('./user');
var configAuth = require('./auth');

var validator = require('validator');

module.exports = function(passport) {

	var callHealthcoin = require('../app.js').callHealthcoin;
	var healthcoinHandler = require('../app.js').healthcoinHandler;
	console.log('DEBUG: callHealthcoin:' + callHealthcoin);

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
		console.log('DEBUG: callHealthcoin:' + callHealthcoin);
		if (!validator.isEmail(email)){
			return done(null, false, req.flash('signupMessage', 'That does not appear to be a valid email address. Please try again.'));
		}
		if (!validator.isByteLength(password, {min:8, max:255})){
			return done(null, false, req.flash('signupMessage', 'The password should be at least 8 characters. Please try again.'));
		}
		email = validator.normalizeEmail(email);
		var res = {};
		callHealthcoin('getnewaddress', res, healthcoinHandler, email);
		var hcn_address = res;
		console.log('DEBUG: res:' + res + 'hcn_address:' + hcn_address);
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
					newUser.local.password = newUser.generateHash(password);
					newUser.role = "User";
					newUser.name = "New User";
					newUser.email = email;
					newUser.photo = "/images/healthcoin-logo.png";
					newUser.description = "";
					newUser.age = "";
					newUser.weight = "";
					newUser.gender = "";
					newUser.ethnicity = "";
					newUser.hcn_account = email; // associate unique email with HCN account
					newUser.hcn_address = hcn_address;

					newUser.save(function(err){
						if(err)
							throw err;
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
			var email = validator.normalizeEmail(profile.emails[0].value);
			var res = {};
			callHealthcoin('getnewaddress', res, healthcoinHandler, email);
			var hcn_address = res;
			console.log('DEBUG: res:' + res + 'hcn_address:' + hcn_address);
			if (hcn_address === ""){
				return done(null, false, req.flash('signupMessage', 'There was an error creating your account. Please try again later.'));
			}
	    	process.nextTick(function(){
	    		User.findOne({'facebook.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user)
	    				return done(null, user); // User found
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.facebook.id = profile.id;
	    				newUser.facebook.token = accessToken;
						newUser.role = "User";
	    				newUser.name = profile.name.givenName + ' ' + profile.name.familyName;
	    				newUser.email = email;
						newUser.photo = profile.photos[0].value;
						newUser.description = "";
						newUser.age = "";
						newUser.weight = "";
						newUser.gender = "";
						newUser.ethnicity = "";
						newUser.hcn_account = email; // associate unique email with HCN account
						newUser.hcn_address = hcn_address;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
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
			var email = validator.normalizeEmail(profile.emails[0].value);
			var res = {};
			callHealthcoin('getnewaddress', res, healthcoinHandler, email);
			var hcn_address = res;
			console.log('DEBUG: res:' + res + 'hcn_address:' + hcn_address);
			if (hcn_address === ""){
				return done(null, false, req.flash('signupMessage', 'There was an error creating your account. Please try again later.'));
			}
	    	process.nextTick(function(){
	    		User.findOne({'google.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user)
	    				return done(null, user); // User found
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.google.id = profile.id;
	    				newUser.google.token = accessToken;
						newUser.role = "User";
	    				newUser.name = profile.displayName;
	    				newUser.email = email;
						newUser.photo = profile.photos[0].value;
						newUser.description = "";
						newUser.age = "";
						newUser.weight = "";
						newUser.gender = "";
						newUser.ethnicity = "";
						newUser.hcn_account = email; // associate unique email with HCN account
						newUser.hcn_address = hcn_address;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
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
			var email = validator.normalizeEmail(profile.emails[0].value);
			var res = {};
			callHealthcoin('getnewaddress', res, healthcoinHandler, email);
			var hcn_address = res;
			console.log('DEBUG: res:' + res + 'hcn_address:' + hcn_address);
			if (hcn_address === ""){
				return done(null, false, req.flash('signupMessage', 'There was an error creating your account. Please try again later.'));
			}
	    	process.nextTick(function(){
	    		User.findOne({'twitter.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err); // Connection error
	    			if(user)
	    				return done(null, user); // User found
	    			else {
	    				var newUser = new User(); // User not found, create one
	    				newUser.twitter.id = profile.id;
	    				newUser.twitter.token = token;
						newUser.role = "User";
	    				newUser.name = profile.displayName;
	    				newUser.email = email;
						newUser.photo = profile.photos[0].value;
						newUser.description = "";
						newUser.age = "";
						newUser.weight = "";
						newUser.gender = "";
						newUser.ethnicity = "";
						newUser.hcn_account = email; // associate unique email with HCN account
						newUser.hcn_address = hcn_address;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
	    					return done(null, newUser);
	    				});
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }
	));

};