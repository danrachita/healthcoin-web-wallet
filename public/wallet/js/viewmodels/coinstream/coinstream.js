define(['knockout',
    'viewmodels/common/command',
    './coinstream-pulldown',
    'moment'], function(ko, Command,Pulldown,Moment){
    var coinstreamType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.statusMessage = ko.observable("");

        // Source value arrays for pulldown menues
        self.pulldown = new Pulldown();

        self.role = ko.observable("");
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
        });
        self.monthView = ko.observable(true);
        self.monthView.subscribe(function (){
            var currYear = Number(Moment(Date.now()).utc().format("YYYY"));
            var startYear = Number(Moment(self.startDate()).utc().format("YYYY"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year...");
            }
        });
        self.chartStyle = ko.observable("Line");
        self.chartStyle.subscribe(function (){
            self.updateCharts();
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];

        self.dataAvg = [56.52, 55.33, 53.7, 56.07, 59.44, 60.78, 61.44, 64.07, 63.26, 61.63, 58.33, 58.13];

        self.coinstreamData = {
            labels: ko.observable(self.labelsMonth),
            datasets: [
                {
                    label: ko.observable(""),
                    backgroundColor: "rgba(45,169,171,0.4)",
                    borderColor: "rgba(45,169,171,0.8)",
                    pointColor: "rgba(151,187,205,1.0)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1.0)",
                    data: ko.observable([])
                },
                {
                    label: "Average Coinstream",
                    backgroundColor: "rgba(220,220,220,0.4)",
                    borderColor: "rgba(220,220,220,1.0)",
                    pointColor: "rgba(220,220,220,1.0)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1.0)",
                    data: ko.observable([])
                }
            ]
        };
    };

    coinstreamType.prototype.refresh = function(){
        var self = this;
        self.updateCharts();
        if (self.wallet.User().profile){
            self.role(self.wallet.User().profile.role);
            self.first_name(self.wallet.User().profile.first_name);
            self.last_name(self.wallet.User().profile.last_name);
            if (self.coinstreamData.datasets[0].label() === ""){
                self.coinstreamData.datasets[0].label(self.first_name() + "'s Coinstream");
            }
            if (self.coinstreamData.datasets[0].data().length === 0){
                self.getBiomarkerScores();
            }
        }
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
        var id = self.wallet.User()._id;
        var startDate = Moment(self.startDate()).utc().format("YYYY-01-01");
        var endDate   = (self.monthView() ?
                        Moment(self.startDate()).utc().format("YYYY-12-31") :
                        Moment(Date.now()).utc().format("YYYY-MM-DD"));
        var startYear = Number(Moment(startDate).utc().format("YYYY"));
        var endYear = Number(Moment(endDate).utc().format("YYYY"));
        var year = 1900;
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                            [encodeURIComponent(btoa(id)),
                                            encodeURIComponent(btoa(startDate)),
                                            encodeURIComponent(btoa(endDate))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                var dataPoints = [], dp = 0, avg = 0;
                // Set labels and avg data points depending on view
                if (startYear < endYear){
                    // Build Year labels and initialize data points
                    self.labelsYear = [];
                    for (year = startYear; year <= endYear; year++){
                        self.labelsYear.push(year);
                        dataPoints.push(0);
                    }
                    self.coinstreamData.labels(self.labelsYear);
                    // Load the average data for as many labels as we have
                    self.coinstreamData.datasets[1].data([]);
                    var avglen = self.dataAvg.length;
                    for (avg = 0; avg < self.labelsYear.length; avg++){
                        var mod = Math.floor(avg / avglen);
                        // This will repeat averages for as long at the labels length
                        self.coinstreamData.datasets[1].data().push(self.dataAvg[avg - (avglen * mod)]);
                    }
                } else {
                    // Month view
                    self.coinstreamData.labels(self.labelsMonth);
                    self.coinstreamData.datasets[1].data(self.dataAvg);
                }
                if (data && data.length){
                    // Push the data to parallel dates[] and scores[] arrays
                    var dates = [];
                    var scores = [];
                    for(var i = 0; i < data.length; i++) {
                        var biomarker = data[i].biomarker;
                        var header = data[i].header;
                        if (biomarker && header && header.user_id === id){
                            // Dates returned oldest to newest.
                            dates.push(biomarker.Date);
                            scores.push(biomarker.Score);
                        }
                    }
                    // Determine which labels and data points to use.
                    if (startYear < endYear){
                        for (dp = 0; dp < dates.length; dp++){
                            year = Number(Moment(dates[dp]).utc().format("YYYY"));
                            var idx = self.labelsYear.indexOf(year);
                            if (idx >= 0){
                                dataPoints[idx] = scores[dp]; // Always uses the latest score if duplicate years
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
                    self.coinstreamData.datasets[0].data(dataPoints);
                    self.statusMessage("You've got Biomarkers!");
                } else {
                    // Reset user data
                    self.coinstreamData.datasets[0].data([]);
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
