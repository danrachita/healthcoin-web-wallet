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
		"EHR_Type" : String,
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

	this.biomarker = {
		"Date" : txcomment.Date,
		"EHR_Source" : txcomment.EHR_Source,
		"EHR_Type" : txcomment.EHR_Type,
		"HA1c" : txcomment.HA1c,
		"Triglycerides" : txcomment.Triglycerides,
		"HDL" : txcomment.HDL,
		"BPS" : txcomment.BPS,
		"BPD" : txcomment.BPD,
		"Age" : txcomment.Age,
		"Weight" : txcomment.Weight,
		"Waist" : txcomment.Waist,
		"Gender" : txcomment.Gender,
		"Ethnicity" : txcomment.Ethnicity,
		"Country" : txcomment.Country,
		"Device_Source" : txcomment.Device_Source,
		"Device_Steps" : txcomment.Device_Steps,
		"Comment" : txcomment.Comment,
		"Score" : txcomment.Score
	};

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
