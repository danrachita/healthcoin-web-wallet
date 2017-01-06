define(['knockout',
    'viewmodels/common/command',
    '../common/coinstream-pulldown',
    '../common/profile-pulldown',
    'moment'], function(ko, Command,CoinstreamPulldown,ProfilePulldown,Moment){
    var coinstreamType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.statusMessage = ko.observable("");

        self.dirtyFlag = ko.observable(false);
        self.isDirty = ko.computed(function() {
            return self.dirtyFlag();
        });

        // Source value arrays for pulldown menues
        self.coinstreamPulldown = new CoinstreamPulldown();
        self.profilePulldown = new ProfilePulldown();
        self.profilePulldown.employerValues()[0] = 'All';  // Admin view only

        self.role = ko.observable("");
        self.user_id = ko.observable("");
        self.employer = ko.observable("");
        self.employee = ko.observable("");
        self.first_name = ko.observable("");
        self.last_name = ko.observable("");

        self.startDate = ko.observable(Moment(Date.now()).utc().format("YYYY-MM-DD"));
        self.startDate.subscribe(function (){
            var currYear = Number(Moment(Date.now()).utc().format("YYYY"));
            var startYear = Number(Moment(self.startDate()).utc().format("YYYY"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                // Ignored if before first change to startDate (refresh)
                if (self.isDirty()){
                    self.getBiomarkerScores();
                }
            } else {
                self.statusMessage("Invalid year...");
            }
        });
        self.monthView = ko.observable(false);
        self.monthView.subscribe(function (){
            self.statusMessage("");
            // Ignored if before first change to startDate (refresh)
            if (self.isDirty()){
                self.getBiomarkerScores();
            }
        });
        // Admin view only
        self.employer.subscribe(function (){
            self.statusMessage("");
            // Ignored if before first change to startDate (refresh)
            if (self.isDirty()){
                self.getBiomarkerScores();
            }
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];

        self.coinstreamAvg = [56.52, 55.33, 53.7, 56.07, 59.44, 60.78, 61.44, 64.07, 63.26, 61.63, 58.33, 58.13];

        self.colorUnapproved = "rgba(251,199,30,0.6)";
        self.colorApproved = "rgba(45,169,171,0.6)";

        self.coinstreamOptions = {
				scales: {
                    yAxes: [{
					    ticks: {
					        max: 100,
					        min: 0,
					        stepSize: 10
					    }
					}]
				},
				observeChanges: true,
				throttle: 500
        };
        self.coinstreamData = {
            labels: ko.observable(self.labelsMonth),
            datasets: [
                {
                    label: "Average Coinstream",
                    backgroundColor: "rgba(220,220,220,0.4)",
                    borderColor: "rgba(220,220,220,0.8)",
                    borderWidth: 1,
                    data: ko.observable([])
                },
                {
                    label: ko.observable(""),
                    backgroundColor: ko.observable([]),
                    borderColor: "rgba(45,169,171,0.8)",
                    borderWidth: 1,
                    data: ko.observable([])
                }
            ]
        };
    };

    coinstreamType.prototype.refresh = function(){
        var self = this;
        if (!self.isDirty()){
            self.role(self.wallet.User().profile.role);
            self.user_id(self.wallet.User()._id);
            self.first_name(self.wallet.User().profile.first_name);
            self.last_name(self.wallet.User().profile.last_name);
            if (self.coinstreamData.datasets[1].label() === ""){
                self.coinstreamData.datasets[1].label(self.first_name() + "'s Coinstream");
            }
            if (self.role() === 'Admin'){
                self.employee('All');
                self.employer('All');
                self.startDate(Moment("1900-01-01").utc().format("YYYY-MM-DD"));
            } else {
                self.employee(self.user_id());
                self.employer(self.wallet.User().profile.employer);
                self.startDate(Moment(self.wallet.User().profile.dob).utc().format("YYYY-MM-DD"));
            }
            self.getBiomarkerScores();
        }
    };

    coinstreamType.prototype.Refresh = function(){
        var self = this;
        self.updateCharts();
    };

    coinstreamType.prototype.updateCharts = function(){
        $('#coinstreamChartBar').css('visibility', 'visible');
    };

    coinstreamType.prototype.coinsEarned = function(dates, scores, dp){
        var improvement = (scores[dp] > scores[dp - 1] ? scores[dp] - scores[dp - 1] : 0);
        var duration = Moment(dates[dp]).diff(Moment(dates[dp - 1]),'days') / 365;
        var improvementAward = improvement * duration;
        var stasisAward = (scores[dp] + scores[dp - 1]) / 2;
        var stasisDurationAward = stasisAward * improvementAward;

        var coins = stasisAward + stasisDurationAward;

        return coins;
    };

    coinstreamType.prototype.getBiomarkerScores = function(){
        var self = this;
        var employer  = (self.employer() === 'All' ? '.*' : self.employer());
        var employee  = (self.employee() === 'All' ? '.*' : self.employee());
        var startDate = Moment(self.startDate()).utc().format("YYYY-01-01");
        var endDate   = (self.monthView() ?
                        Moment(self.startDate()).utc().format("YYYY-12-31") :
                        Moment(Date.now()).utc().format("YYYY-MM-DD"));
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                            [encodeURIComponent(btoa(employee)), // User or All
                                            encodeURIComponent(btoa(employer)),  // User's employer or All
                                            encodeURIComponent(btoa(startDate)),
                                            encodeURIComponent(btoa(endDate))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                var startYear = Number(Moment(startDate).utc().format("YYYY"));
                var endYear = Number(Moment(endDate).utc().format("YYYY"));
                var dataPoints = [], backgroundColors = [], year = 0, dp = 0, avg = 0;
                // Adjust startYear to first datapoint found
                if (!self.isDirty() && data && data.length){
                    self.startDate(Moment(data[0].biomarker.Date).utc().format("YYYY-MM-DD"));
                    startYear = Number(Moment(self.startDate()).utc().format("YYYY"));
                }
                // Set labels and avg data points depending on view
                if (startYear < endYear){
                    // Build Year labels and initialize data points
                    self.labelsYear = [];
                    for (year = startYear; year <= endYear; year++){
                        self.labelsYear.push(year);
                        dataPoints.push(0);
                        backgroundColors.push(self.colorUnapproved);
                    }
                    self.coinstreamData.labels(self.labelsYear);
                    // Load the average scores for as many labels as we have
                    self.coinstreamData.datasets[0].data([]);
                    var avglen = self.coinstreamAvg.length;
                    for (avg = 0; avg < self.labelsYear.length; avg++){
                        var mod = Math.floor(avg / avglen);
                        // This will repeat averages for as long at the labels length
                        self.coinstreamData.datasets[0].data().push(self.coinstreamAvg[avg - (avglen * mod)]);
                    }
                } else {
                    // Month view
                    self.coinstreamData.labels(self.labelsMonth);
                    self.coinstreamData.datasets[0].data(self.coinstreamAvg);
                    for (var mo = 0; mo < 12; mo++){
                        backgroundColors.push(self.colorUnapproved);
                    }
                }
                if (data && data.length){
                    // Push the data to parallel dates[], scores[], approve[] arrays
                    var prevEmployee = "";
                    var dates = [];
                    var scores = [];
                    var approved = [];
                    for(var i = 0; i < data.length; i++) {
                        var biomarker = data[i].biomarker;
                        var header = data[i].header;
                        if (biomarker && header && (header.user_id === employee || self.role() === 'Admin')){
                            // Dates returned oldest to newest.
                            dates.push(biomarker.Date);
                            scores.push(biomarker.Score);
                            approved.push(header.verified ? true : false);
                        }
                    }
                    // Determine which labels and data points to use.
                    if (startYear < endYear){
                        for (dp = 0; dp < dates.length; dp++){
                            year = Number(Moment(dates[dp]).utc().format("YYYY"));
                            var idx = self.labelsYear.indexOf(year);
                            var coins = 0;
                            // Convert scores to coins.
                            // Always uses the latest score if duplicate years
                            // Must have minimum 2 datapoints
                            if (idx > 0){
                                coins = self.coinsEarned(dates, scores, dp);
                            }
                            dataPoints[idx] = coins;
                            if (approved[dp]){
                                backgroundColors[idx] = self.colorApproved;
                            }
                        }
                    } else {
                        // There may be less than 12 month scores, so fill out w/zeros
                        dataPoints = [0,0,0,0,0,0,0,0,0,0,0,0];
                        for (dp = 0; dp < dates.length; dp++){
                            var mm = Number(Moment(dates[dp]).utc().format("MM"));
                            dataPoints[mm - 1] = scores[dp]; // Always uses the latest score if duplicate months
                            if (approved[dp]){
                                backgroundColors[mm - 1] = self.colorApproved;
                            }
                        }
                    }
                    // Load the new user data points
                    self.coinstreamData.datasets[1].data(dataPoints);
                    self.coinstreamData.datasets[1].backgroundColor(backgroundColors);
                    self.statusMessage("You've got Biomarkers!");
                } else {
                    // Reset user data
                    self.coinstreamData.datasets[1].data([]);
                    self.statusMessage("No Biomarkers were found " + (self.monthView() ? "for " : "since ") + startYear + ".");
                }
                self.dirtyFlag(true);
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Biomarker Retrieval Error!");
            });
    };

    return coinstreamType;
});
