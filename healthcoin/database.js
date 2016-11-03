var User       = require('./user');
var validator = require('validator');

function saveUserProfile(id, profile) {
    //console.log("DEBUG: " + JSON.stringify(profile));
	User.findOne({'_id': id}, function(err, user){
		if (user){
			user.profile = profile;
			user.save(function(err){
				if(err)
					return err;
			});
			return "Success!";
		} else {
			return err;
		}
	});
}

module.exports.saveUserProfile = saveUserProfile;
