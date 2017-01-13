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

        self.profileComplete = ko.observable(false);
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
                if (self.isDirty() && self.employer() !== "" && self.employee() !== ""){
                    self.getBiomarkerScores();
                }
            } else {
                self.statusMessage("Invalid year...");
            }
        });
        self.monthView = ko.observable(false);
        self.monthView.subscribe(function (){
            self.statusMessage("");
            if (self.isDirty() && self.employer() !== "" && self.employee() !== ""){
                self.getBiomarkerScores();
            }
        });
        // Admin/Employer view only
        self.employee.subscribe(function (employee){
            self.statusMessage("");
            if (self.isDirty() && self.employer() !== "" && employee && employee !== ""){
                var idx = self.profilePulldown.employeeValues().map(function(e){ return e.id; }).indexOf(employee);
                self.dirtyFlag(false); // Temp reset
                self.first_name(self.profilePulldown.employeeValues()[idx].first_name);
                self.last_name(self.profilePulldown.employeeValues()[idx].last_name);
                self.startDate(Moment(self.profilePulldown.employeeValues()[idx].dob).utc().format("YYYY-MM-DD"));
                self.getBiomarkerScores();
            }
        });
        // Admin view only
        self.employer.subscribe(function (employer){
            self.statusMessage("");
            if (self.isDirty() && employer && employer !== ""){
                self.dirtyFlag(false); // Temp reset
                self.getEmployees(employer);
            }
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];
        //self.colorCoins = "rgba(97,75,175,0.6)"; // Purple
        self.colorCoins = "rgba(251,199,30,0.6)"; // Orangeish
        self.colorNoCoins = "rgba(220,220,220,0.6)"; // Grey
        self.colorApproved = "rgba(45,169,171,0.6)"; // Greenish
        //self.colorUnapproved = "rgba(251,199,30,0.6)"; // Orangeish
        self.colorUnapproved = "rgba(220,220,220,0.6)"; // Grey
        self.coinstreamOptions = {
				legend: {
                    labels: {
                        fontSize: 16
                    }
				},
				scales: {
                    xAxes: [{
					    ticks: {
                            fontSize: 14
					    }
					}],
                    yAxes: [{
					    ticks: {
                            fontSize: 16,
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
                    // Biomarker Health Scores
                    label: ko.observable(""),
                    backgroundColor: ko.observable([]),
                    borderColor: "rgba(97,75,175,0.8)",
                    borderWidth: 2,
                    data: ko.observable([])
                },
                {
                    // Coinstream
                    label: ko.observable(""),
                    backgroundColor: ko.observable([]),
                    borderColor: "rgba(45,169,171,0.8)",
                    borderWidth: 2,
                    data: ko.observable([])
                }
            ]
        };
    };

    coinstreamType.prototype.refresh = function(timerRefresh){
        var self = this;
        if (!self.profileComplete() && !self.wallet.profileComplete()){
            self.statusMessage("Please complete your profile before continuing.");
        } else {
            if (!self.profileComplete()){
                self.profileComplete(true);
                self.statusMessage("");
            }
            if (timerRefresh && !self.isDirty()){
                self.role(self.wallet.User().profile.role);
                self.user_id(self.wallet.User()._id);
                self.first_name(self.wallet.User().profile.first_name);
                self.last_name(self.wallet.User().profile.last_name);
                if (self.coinstreamData.datasets[0].label() === ""){
                    self.coinstreamData.datasets[0].label("Health Score");
                    self.coinstreamData.datasets[1].label("Coins Earned");
                }
                // Init to self
                self.employee(self.user_id());
                self.employer(self.wallet.User().profile.employer);
                self.profilePulldown.employeeValues([{id: "", dob: "", name: ""}]);
                self.profilePulldown.employeeValues().push({
                    id: self.employee(),
                    dob: self.wallet.User().profile.dob,
                    first_name: self.first_name(),
                    last_name: self.last_name(),
                    full_name: self.last_name() + ", " + self.first_name()
                    });
                if (self.role() === 'Admin'){
                    // Set empty slot to Admin's employer (MASTER_ACCOUNT's may not be in list)
                    self.profilePulldown.employerValues()[0] = self.employer();
                } else {
                    if (self.role() === 'Employer'){
                        // Only one option available to Employer
                        self.profilePulldown.employerValues([self.employer()]);
                        // Get the list of employees
                        self.getEmployees(self.employer());
                    } else {
                        // Only one option available to User (pulldown is invisible tho)
                        self.profilePulldown.employerValues([self.employer()]);
                    }
                }
                // Init chart to whoever is logged in
                self.startDate(Moment(self.wallet.User().profile.dob).utc().format("YYYY-MM-DD"));
            }
            if (!timerRefresh){
                self.getBiomarkerScores();
            }
        }
    };

    coinstreamType.prototype.updateCharts = function(){
        $('#coinstreamChartBar').css('visibility', 'visible');
    };

    coinstreamType.prototype.coinsEarned = function(dates, scores, dp){
        var self = this;
        var improvement = Number((scores[dp] > scores[dp - 1] ? scores[dp] - scores[dp - 1] : 0));
        var duration = Number(Moment(dates[dp]).diff(Moment(dates[dp - 1]),'days') / 365);
        if (duration >= 2.0) duration = 1.0; // Only allow for one+ year but no more than 2 (reset)
        var improvementAward = Number(improvement * duration);
        var stasis = Number((scores[dp] + scores[dp - 1]) / 2);
        var stasisAward = Number(stasis * duration);

        var coins = Number(improvementAward + stasisAward);
        return (coins <= 100 ? self.wallet.formatNumber(coins, self.wallet.settings().decimalPlaces, '.', ',') : 100);
    };

    coinstreamType.prototype.getBiomarkerScores = function(){
        var self = this;
        var employee  = self.employee();
        var startDate = Moment(self.startDate()).utc().format("YYYY-01-01");
        var endDate   = (self.monthView() ?
                        Moment(self.startDate()).utc().format("YYYY-12-31") :
                        Moment(Date.now()).utc().format("YYYY-MM-DD"));
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                            [encodeURIComponent(btoa(employee)),
                                            encodeURIComponent(btoa(startDate)),
                                            encodeURIComponent(btoa(endDate))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                self.dirtyFlag(false);
                var startYear = Number(Moment(startDate).utc().format("YYYY"));
                var endYear = Number(Moment(endDate).utc().format("YYYY"));
                var scorePoints = [], coinPoints = [], backgroundCoins = [], backgroundScores = [], year = 0, dp = 0;
                // Adjust startYear to first datapoint found
                if (data && data.length){
                    self.startDate(Moment(data[0].biomarker.Date).utc().format("YYYY-MM-DD"));
                    startYear = Number(Moment(self.startDate()).utc().format("YYYY"));
                }
                // Initialize labels and data points depending on view
                if (startYear < endYear){
                    // Build Year labels and initialize data points
                    self.labelsYear = [];
                    for (year = startYear; year <= endYear; year++){
                        self.labelsYear.push(year);
                        scorePoints.push(0);
                        backgroundScores.push(self.colorApproved); // TODO: Change default bg to colorUnapproved
                        coinPoints.push(0);
                        backgroundCoins.push(self.colorCoins); // TODO: Change default bg to colorNoCoins
                    }
                    self.coinstreamData.labels(self.labelsYear);
                } else {
                    // Month view
                    for (var mo = 0; mo < 12; mo++){
                        scorePoints.push(0);
                        backgroundScores.push(self.colorApproved); // TODO: Change default bg to colorUnapproved
                        coinPoints.push(0);
                        backgroundCoins.push(self.colorCoins); // TODO: Change default bg to colorNoCoins
                    }
                    self.coinstreamData.labels(self.labelsMonth);
                }

                // Build the datapoints
                if (data && data.length){
                    // Push the data to parallel dates[], scores[], approve[] arrays
                    var dates = [], scores = [], approved = [], coins = 0, coinsTotal = 0;
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
                            // Always uses the best score if duplicate years
                            if (idx >= 0){
                                if (scores[dp] > scorePoints[idx]){
                                    scorePoints[idx] = scores[dp];
                                    if (approved[dp]){ // TODO: Later
                                        backgroundScores[idx] = self.colorApproved;
                                    }
                                }
                            }
                            // Convert scores to coins. Must have minimum 2 datapoints
                            if (idx > 0){
                                // Always uses the most coins if duplicate years
                                coins = self.coinsEarned(dates, scores, dp);
                                if (coins > coinPoints[idx]){
                                    coinPoints[idx] = coins;
                                    coinsTotal += Number(coins);
                                    if (approved[dp]){ // TODO: Later
                                        backgroundCoins[idx] = self.colorCoins;
                                    }
                                }
                            }
                        }
                    } else {
                        // There should be less than 12 month scores, so use MM for index
                        for (dp = 0; dp < dates.length; dp++){
                            var mm = Number(Moment(dates[dp]).utc().format("MM"));
                            // Always uses the best score if duplicate months
                            if (scores[dp] > scorePoints[mm - 1]){
                                scorePoints[mm - 1] = scores[dp];
                                if (approved[dp]){ // TODO: Later
                                    backgroundScores[mm - 1] = self.colorApproved;
                                }
                            }
                            // Convert scores to coins. Must have minimum 2 datapoints
                            if (dp > 0){
                                // Always uses the most coins if duplicate years
                                coins = self.coinsEarned(dates, scores, dp);
                                if (coins > coinPoints[mm - 1]){
                                    coinPoints[mm - 1] = coins;
                                    coinsTotal += Number(coins);
                                    if (approved[dp]){ // TODO: Later
                                        backgroundCoins[mm - 1] = self.colorCoins;
                                    }
                                }
                            }
                        }
                    }
                    // Load the user's scores/coins
                    self.coinstreamData.datasets[0].data(scorePoints);
                    self.coinstreamData.datasets[0].backgroundColor(backgroundScores);
                    self.coinstreamData.datasets[1].data(coinPoints);
                    self.coinstreamData.datasets[1].backgroundColor(backgroundCoins);
                    if (data.length > 1){
                        self.statusMessage(self.first_name() + "'s earned " + self.wallet.formatNumber(coinsTotal, self.wallet.settings().decimalPlaces, '.', ',') + " healthcoins!");
                    } else {
                        self.statusMessage(self.first_name() + "'s on the way to earning healthcoins!");
                    }
                } else {
                    // Reset user data
                    self.coinstreamData.labels(self.labelsMonth);
                    self.coinstreamData.datasets[0].data([]);
                    self.coinstreamData.datasets[1].data([]);
                    self.statusMessage("No Health Scores were found " + (self.monthView() ? "for " : "since ") + startYear + ".");
                }
                // Set dirty after return from command
                self.dirtyFlag(true);
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Health Score Retrieval Error!");
            });
    };

    coinstreamType.prototype.getEmployees = function(employer){
        var self = this;
        var getEmployeesCommand = new Command('getemployees',
                                            [encodeURIComponent(btoa(employer))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getEmployeesCommand.execute())
            .done(function(data){
                self.dirtyFlag(false);
                // Re-init to blanks
                var employeeValues = [{id: "", dob: "", name: ""}];
                // Build the dropdown
                if (data && data.length){
                    //console.log("DEBUG: employees = " + JSON.stringify(data));
                    for(var i = 0; i < data.length; i++) {
                        employeeValues.push({
                            id: data[i]._id,
                            dob: data[i].profile.dob,
                            first_name: data[i].profile.first_name,
                            last_name: data[i].profile.last_name,
                            full_name: data[i].profile.last_name + ", " + data[i].profile.first_name
                            });
                    }
                    self.profilePulldown.employeeValues(employeeValues);
                    //console.log("DEBUG: employeeValues = " + JSON.stringify(self.profilePulldown.employeeValues()));
                } else {
                    self.statusMessage("No Employees were found.");
                }
                // Set dirty after return from command
                self.dirtyFlag(true);
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Employees Retrieval Error!");
            });
    };

    return coinstreamType;
});
