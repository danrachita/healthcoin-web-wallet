var mongoose = require('mongoose');
var biomarkersSchema = mongoose.Schema({
	"header" : {
		"version" : String,
		"date" : Date,
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
		"A1c" : Number,
		"Triglycerides" : Number,
		"HDL" : Number,
		"BPS" : Number,
		"BPD" : Number,
		"Waist" : Number,
		"Weight" : Number,
		"Device_Source" : String,
		"Device_Steps" : Number,
		"Other" : String
	}
});

biomarkersSchema.methods.buildBiomarker = function(credit, user_id, txcomment){
	this.header.version = "1.0.0";
	this.header.date = Date.now();
	this.header.user_id = user_id;
	this.header.credit = credit;
	this.header.index = {
		"subject": "Biomarker Data for Diabetic and Pre-Diabetic",
		"keywords": "diabetes,pre-diabetes,insulin,sugar-intake,diet,excercise,weight"
	};
	this.biomarker = {
		"Date": txcomment.Date,
		"EHR_Source": txcomment.EHR_Source,
		"EHR_Type": txcomment.EHR_Type,
		"A1c": txcomment.A1c,
		"Triglycerides": txcomment.Triglycerides,
		"HDL": txcomment.HDL,
		"BPS": txcomment.BPS,
		"BPD": txcomment.BPD,
		"Waist": txcomment.Waist,
		"Weight": txcomment.Weight,
		"Device_Source": txcomment.Device_Source,
		"Device_Steps": txcomment.Device_Steps,
		"Other": txcomment.Other
	};

	this.save(function(err){
		if(err)
			throw err;
	});
	return this;
};

module.exports = mongoose.model('Biomarkers', biomarkersSchema);
