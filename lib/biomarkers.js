var fs = require('fs');
var mongoose = require('mongoose');
var Dateformat = require('./dateformat');
var biomarkersSchema = mongoose.Schema({
	"header" : {
		"version" : String,
		"submitted" : Date,
		"verified" : Date,
		"user_id" : String, // mongodb _id
		"credit" : Number,
		"index" : {
			"subject" : String,
			"keywords" : String
		}
	},
	"biomarker" : {
		"Date" : Date,
		"EHR_Source" : String,
		"Employer" : String,
		"HA1c" : Number,
		"Triglycerides" : Number,
		"HDL" : Number,
		"BPS" : Number,
		"BPD" : Number,
		"Age" : Number,
		"Weight" : Number,
		"Waist" : Number,
		"Gender" : String,
		"Ethnicity" : String,
		"Country" : String,
		"Device_Source" : String,
		"Device_Steps" : Number,
		"Comment" : String,
		"Score" : Number
	},
	"proofOfBiomarker" : {
		"files" : Array
	}
});

biomarkersSchema.methods.buildBiomarker = function(credit, user_id, txcomment, verified, dataURLArray){
	this.header = {
		"version" : "1.0.2",
		"submitted" : Dateformat(Date.now(), "GMT:yyyy-mm-dd"),
		"verified" : verified ? Dateformat(Date.now(), "GMT:yyyy-mm-dd") : null,
		"user_id" : user_id,
		"credit" : credit,
		"index" : {
			"subject" : "Biomarker Data for Diabetic and Pre-Diabetic Research",
			"keywords" : "diabetes, pre-diabetes, HA1c, Triglycerides, insulin, sugar-intake, diet, excercise, weight"
		}
	};

	this.biomarker = JSON.parse(txcomment);

	this.proofOfBiomarker = {
		"files": dataURLArray || []
	};

	this.save(function(err){
		if(err)
			throw err;
	});
	return { header: this.header, biomarker: this.biomarker };
};

module.exports = mongoose.model('Biomarkers', biomarkersSchema);
