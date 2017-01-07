var mongoose = require('mongoose');
var User = require('./user');
var Biomarkers = require('./biomarkers');

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

    // Get the user's biomarkers within a date range
    getBiomarkerScores: function(version, employee, employer, startDate, endDate, cb) {
        Biomarkers.find({'header.version': version,
                        'header.user_id': {$regex: employee, $options: 'i'},
                        'biomarker.Date': {$gte: startDate, $lte: endDate},
                        'biomarker.Employer': {$regex: employer, $options: 'i'}},
                        {'header.user_id': 1, // Ascending order return fields
                        'biomarker.Date': 1,
                        'biomarker.Score': 1,
                        'biomarker.Employer': 1,
                        'header.verified': 1},
                        function(err, biomarkers){
                            //console.log("DEBUG: biomarkers = " + JSON.stringify(biomarkers));
                            cb(err, biomarkers);
                        }).sort({'biomarker.Date': 1});
    },

    // Get the user's biomarkers within a date range
    getEmployees: function(employer, cb) {
        User.find({'profile.employer': employer},
                  {'profile.last_name': 1, // Ascending order return fields
                   'profile.first_name': 1,
                   'profile.dob': 1,
                   '_id': 1},
                   function(err, employees){
                       cb(err, employees);
                   }).sort({'profile.last_name': 1,
                            'profile.first_name': 1});
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
