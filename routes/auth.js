var User = require('../public/js/viewmodels/auth/user');
module.exports = function(app, passport){
	//app.get('/', function(req, res){
	//	res.render('index.ejs');
	//});

	app.get('/login', function(req, res){
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));

	app.get('/signup', function(req, res){
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});


	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/signup',
		failureFlash: true
	}));

	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile.ejs', { user: req.user });
	});

	// Facebook auth
	app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));
	app.get('/auth/facebook/callback', 
	  passport.authenticate('facebook', { successRedirect: '/#healthcoin',
	                                      failureRedirect: '/' }));

	// Google auth
	app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));
	app.get('/auth/google/callback', 
	  passport.authenticate('google', { successRedirect: '/#healthcoin',
	                                      failureRedirect: '/' }));

	// Twitter auth
	app.get('/auth/twitter', passport.authenticate('twitter', {scope: ['email']}));
	app.get('/auth/twitter/callback', 
	  passport.authenticate('twitter', { successRedirect: '/#healthcoin',
	                                      failureRedirect: '/' }));

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}

	res.redirect('/login');
}