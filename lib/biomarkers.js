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
		"A1C" : Number,
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
		"Score" : Number,
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
		"A1C": txcomment.A1C,
		"Triglycerides": txcomment.Triglycerides,
		"HDL": txcomment.HDL,
		"BPS": txcomment.BPS,
		"BPD": txcomment.BPD,
		"Age": txcomment.Age,
		"Weight": txcomment.Weight,
		"Waist": txcomment.Waist,
		"Gender" : txcomment.Gender,
		"Ethnicity" : txcomment.Ethnicity,
		"Country" : txcomment.Country,
		"Device_Source": txcomment.Device_Source,
		"Device_Steps": txcomment.Device_Steps,
		"Score" : txcomment.Score,
		"Other": txcomment.Other
	};

	this.save(function(err){
		if(err)
			throw err;
	});
	return this;
};

module.exports = mongoose.model('Biomarkers', biomarkersSchema);
