define(['knockout',
    'viewmodels/common/command',
    './coinstream-pulldown',
    'lib/dateformat'], function(ko, Command,Pulldown,Dateformat){
    var coinstreamType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        // Source value arrays for pulldown menues
        self.pulldown = new Pulldown();

        self.name = ko.observable("");
        self.role = ko.observable("");

        self.startDate = ko.observable(Dateformat(Date.now(), "GMT:yyyy"));
        self.startDate.subscribe(function (){
            var currYear = Number(Dateformat(Date.now(), "GMT:yyyy"));
            var startYear = Number(Dateformat(self.startDate(), "GMT:yyyy"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year...");
            }
        });
        self.monthView = ko.observable(true);
        self.monthView.subscribe(function (){
            var currYear = Number(Dateformat(Date.now(), "GMT:yyyy"));
            var startYear = Number(Dateformat(self.startDate(), "GMT:yyyy"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year...");
            }
        });
        self.chartStyle = ko.observable("Line");
        self.chartStyle.subscribe(function (){
            self.updateCharts(self.chartStyle());
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];

        self.dataAvg = [56.52, 55.33, 53.7, 56.07, 59.44, 60.78, 61.44, 64.07, 63.26, 61.63, 58.33, 58.13];

        self.coinstreamData = {
            labels: ko.observable(self.labelsMonth),
            datasets: [
                {
                    label: "Your Coinstream",
                    backgroundColor: "rgba(45,169,171,0.4)",
                    borderColor: "rgba(45,169,171,1.0)",
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
                    data: ko.observable(self.dataAvg)
                }
            ]
        };

        self.statusMessage = ko.observable("");
    };

    coinstreamType.prototype.refresh = function(){
        var self = this;
        if (self.wallet.User().profile){
            self.name(self.wallet.User().profile.name);
            self.role(self.wallet.User().profile.role);
            if (typeof self.coinstreamData.datasets[0].data !== 'undefined' &&
                self.coinstreamData.datasets[0].data().length === 0){
                self.getBiomarkerScores();
            }
        }
    };

    coinstreamType.prototype.Refresh = function(){
        var self = this;
        self.getBiomarkerScores();
    };

    coinstreamType.prototype.updateCharts = function(style){
        var canvasLine = document.getElementById('coinstreamChartLine');
        var canvasBar = document.getElementById('coinstreamChartBar');
        switch(style){
            case ("Line"):
                canvasLine.style.visibility='visible';
                canvasBar.style.visibility='hidden';
                break;
            case ("Bar"):
                canvasLine.style.visibility='hidden';
                canvasBar.style.visibility='visible';
                break;
            default:
                canvasLine.style.visibility='visible';
                canvasBar.style.visibility='hidden';
                break;
        }
    };

    coinstreamType.prototype.getBiomarkerScores = function(){
        var self = this;
        var id = self.wallet.User()._id;
        var startDate = Dateformat(self.startDate(), "GMT:yyyy-mm-dd");
        var endDate   = (self.monthView() ?
                        Dateformat(self.startDate(), "GMT:yyyy") + '-12-31' :
                        Dateformat(Date.now(), "GMT:yyyy-mm-dd"));
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                            [encodeURIComponent(btoa(id)),
                                            encodeURIComponent(btoa(startDate)),
                                            encodeURIComponent(btoa(endDate))],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                if (data && data.length){
                    // Push the data to parallel dates[] and scores[] arrays
                    var dates = [];
                    var scores = [];
                    for(var i = 0; i < data.length; i++) {
                        var biomarker = data[i].biomarker;
                        var header = data[i].header;
                        if (biomarker && header && header.user_id === id){
                            // Dates returned oldest to newest.
                            dates.push(Dateformat(biomarker.Date, "GMT:yyyy-mm-dd")); // Dates from db need conversion to GMT
                            scores.push(biomarker.Score);
                        }
                    }
                    // Process the data arrays
                    if (scores.length && dates.length){
                        var startYear = Number(Dateformat(dates[0], "GMT:yyyy"));
                        var endYear = Number(Dateformat(endDate, "GMT:yyyy"));
                        // Determine which labels and data points to use.
                        var dataPoints = [], dp = 0;
                        if (startYear < endYear){
                            // Build Year labels and data points
                            self.labelsYear = [];
                            for (dp = 0; dp < dates.length; dp++){
                                var year = Number(Dateformat(dates[dp], "GMT:yyyy"));
                                // See if we already have this year
                                var idx = self.labelsYear.indexOf(year);
                                if (idx < 0){
                                    self.labelsYear.push(year);
                                    dataPoints.push(scores[dp]);
                                } else {
                                    // Already have this year
                                    dataPoints[idx] = scores[dp]; // Always use the latest score if multiples
                                }
                            }
                            // Make sure we have the current year label and a data point
                            if (self.labelsYear.indexOf(endYear) < 0){
                                self.labelsYear.push(endYear);
                                dataPoints.push(0);
                            }
                            // Load the new Years labels
                            self.coinstreamData.labels(self.labelsYear);
                            // Load the average data for as many labels as we have
                            self.coinstreamData.datasets[1].data([]);
                            for (avg = 0; avg < self.labelsYear.length; avg++){
                                self.coinstreamData.datasets[1].data().push(self.dataAvg[avg]);
                            }
                        } else {
                            // Using static Month labels and average data points.
                            self.coinstreamData.labels(self.labelsMonth);
                            self.coinstreamData.datasets[1].data(self.dataAvg);
                            // There may be less than 12 month scores, so fill out w/zeros
                            dataPoints = [0,0,0,0,0,0,0,0,0,0,0,0];
                            for (dp = 0; dp < dates.length; dp++){
                                var mm = Number(Dateformat(dates[dp], "GMT:mm"));
                                dataPoints[mm - 1] = scores[dp]; // Always use the latest score if multiples
                            }
                        }
                        // Load the new user data points
                        self.coinstreamData.datasets[0].data(dataPoints);
                        self.statusMessage("You've got Biomarkers!");
                    } else {
                        self.coinstreamData.datasets[0].data([]);
                        self.statusMessage("No Biomarkers were found.");
                    }
                } else {
                    self.coinstreamData.datasets[0].data([]);
                    self.statusMessage("No Biomarkers were found " + (self.monthView() ? "for " : "since ") + Dateformat(self.startDate(), "GMT:yyyy") + ".");
                }
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Biomarker Retrieval Error!");
            });
    };

    return coinstreamType;
});
