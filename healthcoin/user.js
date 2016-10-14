var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var userSchema = mongoose.Schema({
	local: {
		username: String,
		password: String
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
		role: String,
		name: String,
		email: String,
		description: String,
		age: Number,
		weight: Number,
		gender: String,
		ethnicity: String
	},
	wallet: {
		hcn_node_id: String,
		hcn_account: String,
		hcn_address: String
	}
});

userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
};

userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
