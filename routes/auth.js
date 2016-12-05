module.exports = function(app, passport){

	app.get('/', isLoggedIn, function(req, res){
		if (req.user.local.changeme){
			res.redirect('/password');
		}
		console.log("DEBUG: " + JSON.stringify(req.session.user));
		res.render('home.ejs'); // If logged in, allow access to the Web Wallet
	});

	// Local login
	app.get('/login', function(req, res){
		req.logout();
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	app.post('/login',
		passport.authenticate('local-login', { failureRedirect: '/login', failureFlash: true }),
			function(req, res) {
				req.session.user = req.user;
				res.redirect('/');
			}
	);

	// Local signup
	app.get('/signup', function(req, res){
		if(req.isAuthenticated()){
			res.redirect('/');
		}
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/login', // Require login on success
		failureRedirect: '/signup',
		failureFlash: true
	}));

	// Local change password
	app.get('/password', isLoggedIn, function(req, res){
		res.render('password.ejs', { message: req.flash('passwordMessage'), user: req.user }); // If logged in, allow password change
	});
	app.post('/password', passport.authenticate('local-password', {
		successRedirect: '/login', // Require login on success
		failureRedirect: '/password',
		failureFlash: true
	}));

	// Facebook auth
	app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));
	app.get('/auth/facebook/callback', 
	    passport.authenticate('facebook', { failureRedirect: '/' }),
			function(req, res) {
				req.session.user = req.user;
				res.redirect('/');
			}
	);

	// Google auth
	app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));
	app.get('/auth/google/callback', 
	    passport.authenticate('google', { failureRedirect: '/' }),
			function(req, res) {
				req.session.user = req.user;
				res.redirect('/');
			}
	);

	// Twitter auth
	app.get('/auth/twitter', passport.authenticate('twitter', {scope: ['email']}));
	app.get('/auth/twitter/callback', 
	    passport.authenticate('twitter', { failureRedirect: '/' }),
			function(req, res) {
				req.session.user = req.user;
				res.redirect('/');
			}
	);

	app.get('/logout', function(req, res){
		if (req.session)
			req.session.destroy();
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated() && req.session){
		return next();
	}
	res.render('index.ejs');
}
