var mongoose = require('mongoose');
var User = require('./user');
var Biomarkers = require('./biomarkers');
var validator = require('validator');

module.exports = {
    // Initialize DB
    connect: function(database, cb) {
        mongoose.connect(database, function(err) {
            if (err) {
                console.log('Unable to connect to database: %s', database);
                process.exit(1);
            }
            return cb();
        });
    },

    // Save the user's profile
    getBiomarkerScores: function(id, startdate, cb) {
        Biomarkers.find({'header.user_id': id, 'biomarker.Date': {$gte: startdate}},        // query fields
                        {'biomarker.Date': 1, 'biomarker.Score': 1, 'header.user_id': 1},   // return fields
                        function(err, biomarkers){
                            //console.log("DEBUG: biomarkers = " + JSON.stringify(biomarkers));
                            cb(err, biomarkers);
                        }).sort({'biomarker.Date': 1});
    },

    // Save the user's profile
    saveUserProfile: function(id, profile) {
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
};
