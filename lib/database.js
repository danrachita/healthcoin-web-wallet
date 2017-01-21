var mongoose = require('mongoose');
var User = require('./user');
var Biomarkers = require('./biomarkers');
var opts = {server: {
                socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
                reconnectTries: 3, reconnectInterval: 3000
                }
            };
mongoose.Promise = global.Promise;

module.exports = {
    // Initialize DB
    connect: function(database, cb) {
        mongoose.connect(database, opts, function(err) {
            if (err) {
                console.log('Unable to connect to database: %s', database);
                return cb(err);
            }
            return cb(null);
        });

        mongoose.connection.on('close', function (){
            process.emit('database_closed', "Database closed.");
        });
        mongoose.connection.on('error', function (err){
            process.emit('SIGINT', err);
        });
        mongoose.connection.on('disconnected', function (){
            console.log('Database disconnected.');
        });
        mongoose.connection.on('reconnected', function (){
            console.log('Database reconnected.');
        });
    },

    // Close DB
    close: function(cb) {
        mongoose.connection.close(function (){
            return cb();
        });
    },

    // Get the user's biomarkers within a date range
    getBiomarkerScores: function(version, employee, startDate, endDate, cb) {
        Biomarkers.find({'header.version': version,
                        'header.user_id': {$regex: employee, $options: 'i'},
                        'biomarker.Date': {$gte: startDate, $lte: endDate}},
                        {'header.user_id': 1, // Ascending order return fields
                        'biomarker.Date': 1,
                        'biomarker.Score': 1,
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
    saveUserProfile: function(id, profile, cb) {
        //console.log("DEBUG: " + JSON.stringify(profile));
        User.findOne({'_id': id}, function(err, user){
            if (user){
                user.profile = profile;
                user.save(function(err){
                    if(err)
                        cb(err, "Save Error!");
                    else
                        cb(err, "Success!");
                });
            } else {
                cb(err, "User Not Found!");
            }
        });
    }
};
