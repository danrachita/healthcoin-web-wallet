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
        self.profilePulldown.employerValues()[0] = 'All';  // Visible to Admin

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
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year...");
            }
            self.dirtyFlag(true);
        });
        self.monthView = ko.observable(false);
        self.monthView.subscribe(function (){
            var currYear = Number(Moment(Date.now()).utc().format("YYYY"));
            var startYear = Number(Moment(self.startDate()).utc().format("YYYY"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year...");
            }
            self.dirtyFlag(true);
        });
        self.chartStyle = ko.observable("Line");
        self.chartStyle.subscribe(function (){
            self.updateCharts();
            self.dirtyFlag(true);
        });

        // Admin
        self.employer.subscribe(function (){
            self.updateCharts();
            self.dirtyFlag(true);
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];

        self.dataAvg = [56.52, 55.33, 53.7, 56.07, 59.44, 60.78, 61.44, 64.07, 63.26, 61.63, 58.33, 58.13];

        self.colorApproved = "rgba(151,187,205,1.0)";
        self.colorUnapproved = "rgba(251,199,30,1.0)";

        self.coinstreamOptions = {
				reverse: true,
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
                    borderColor: "rgba(220,220,220,1.0)",
                    pointBackgroundColor: "rgba(220,220,220,1.0)",
                    pointRadius: 4,
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1.0)",
                    data: ko.observable([])
                },
                {
                    label: ko.observable(""),
                    backgroundColor: "rgba(45,169,171,0.4)",
                    borderColor: "rgba(45,169,171,0.8)",
                    pointBackgroundColor: ko.observable([]),
                    pointRadius: 4,
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: ko.observable(self.colorApproved),
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
            if (self.role() === 'Admin'){
                self.employer('All');
                self.employee('All');
            } else {
                self.employee(self.user_id());
                self.employer(self.wallet.User().profile.employer);
            }
            self.first_name(self.wallet.User().profile.first_name);
            self.last_name(self.wallet.User().profile.last_name);
            if (self.coinstreamData.datasets[1].label() === ""){
                self.coinstreamData.datasets[1].label(self.first_name() + "'s Coinstream");
            }
            if (self.coinstreamData.datasets[1].data().length === 0){
                self.getBiomarkerScores();
            }
        }
        self.updateCharts();
    };

    coinstreamType.prototype.Refresh = function(){
        var self = this;
        self.updateCharts();
    };

    coinstreamType.prototype.updateCharts = function(){
        var self = this;
        var canvasLine = document.getElementById('coinstreamChartLine');
        var canvasBar = document.getElementById('coinstreamChartBar');
        if (canvasLine && canvasBar){
            switch(self.chartStyle()){
                case ("Line"):
                    $('#coinstreamChartLine').css('visibility', 'visible');
                    $('#coinstreamChartBar').css('visibility', 'hidden');
                    //canvasLine.style.visibility = 'visible';
                    //canvasBar.style.visibility = 'hidden';
                    break;
                case ("Bar"):
                    $('#coinstreamChartLine').css('visibility', 'hidden');
                    $('#coinstreamChartBar').css('visibility', 'visible');
                    //canvasLine.style.visibility = 'hidden';
                    //canvasBar.style.visibility = 'visible';
                    break;
                default:
                    $('#coinstreamChartLine').css('visibility', 'visible');
                    $('#coinstreamChartBar').css('visibility', 'hidden');
                    //canvasLine.style.visibility = 'visible';
                    //canvasBar.style.visibility = 'hidden';
                    break;
            }
        }
    };

    coinstreamType.prototype.getBiomarkerScores = function(){
        var self = this;
        var employer  = (self.employer() === 'All' ? '.*' : self.employer());
        var employee  = (self.employee() === 'All' ? '.*' : self.employee());
        var startDate = Moment(self.startDate()).utc().format("YYYY-01-01");
        var endDate   = (self.monthView() ?
                        Moment(self.startDate()).utc().format("YYYY-12-31") :
                        Moment(Date.now()).utc().format("YYYY-MM-DD"));
        var startYear = Number(Moment(startDate).utc().format("YYYY"));
        var endYear = Number(Moment(endDate).utc().format("YYYY"));
        var year = 1900;
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                            [encodeURIComponent(btoa(employee)), // User or All
                                            encodeURIComponent(btoa(employer)),  // User's employer or All
                                            encodeURIComponent(btoa(startDate)),
                                            encodeURIComponent(btoa(endDate))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                var dataPoints = [], pointColors = [], dp = 0, avg = 0;
                // Set labels and avg data points depending on view
                if (startYear < endYear){
                    // Build Year labels and initialize data points
                    self.labelsYear = [];
                    for (year = startYear; year <= endYear; year++){
                        self.labelsYear.push(year);
                        dataPoints.push(0);
                        pointColors.push(self.colorUnapproved);
                    }
                    self.coinstreamData.labels(self.labelsYear);
                    // Load the average data for as many labels as we have
                    self.coinstreamData.datasets[0].data([]);
                    var avglen = self.dataAvg.length;
                    for (avg = 0; avg < self.labelsYear.length; avg++){
                        var mod = Math.floor(avg / avglen);
                        // This will repeat averages for as long at the labels length
                        self.coinstreamData.datasets[0].data().push(self.dataAvg[avg - (avglen * mod)]);
                    }
                } else {
                    // Month view
                    self.coinstreamData.labels(self.labelsMonth);
                    self.coinstreamData.datasets[0].data(self.dataAvg);
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
                        if (biomarker && header && (header.user_id === self.user_id() || self.role() === 'Admin')){
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
                            if (idx >= 0){
                                dataPoints[idx] = scores[dp]; // Always uses the latest score if duplicate years
                                if (approved[idx]){
                                    pointColors[idx] = self.colorApproved;
                                }
                            }
                        }
                    } else {
                        // There may be less than 12 month scores, so fill out w/zeros
                        dataPoints = [0,0,0,0,0,0,0,0,0,0,0,0];
                        for (dp = 0; dp < dates.length; dp++){
                            var mm = Number(Moment(dates[dp]).utc().format("MM"));
                            dataPoints[mm - 1] = scores[dp]; // Always uses the latest score if duplicate months
                        }
                    }
                    // Load the new user data points
                    self.coinstreamData.datasets[1].data(dataPoints);
                    self.coinstreamData.datasets[1].pointBackgroundColor(pointColors);
                    self.statusMessage("You've got Biomarkers!");
                } else {
                    // Reset user data
                    self.coinstreamData.datasets[1].data([]);
                    self.statusMessage("No Biomarkers were found " + (self.monthView() ? "for " : "since ") + startYear + ".");
                }
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Biomarker Retrieval Error!");
            });
    };

    return coinstreamType;
});
