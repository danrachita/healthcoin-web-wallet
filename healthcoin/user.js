var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var userSchema = mongoose.Schema({
	local: {
		username: String,
		password: String,
		changeme: Boolean
	},
	facebook: {
		id: String,
		token: String
	},
	google: {
		id: String,
		token: String
	},
	twitter: {
		id: String,
		token: String
	},
	profile: {
		last_login: Date,
		role: String,
		name: String,
		email: String,
		description: String,
		age: Number,
		weight: Number,
		gender: String,
		ethnicity: String,
		credit: Number
	},
	wallet: [
			{ node_id: String, account: String, address: String }
			]
});

userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
};

userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
