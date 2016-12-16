define(['knockout',
    'viewmodels/common/command',
    'lib/dateformat'], function(ko, Command, Dateformat){
    var coinstreamType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.name = ko.observable("");
        self.role = ko.observable("");

        self.startYear = ko.observable(Dateformat(Date.now(), "yyyy"));
        self.startYear.subscribe(function (){
            var currYear = Number(Dateformat(Date.now(), "yyyy"));
            var startYear = Number(Dateformat(self.startYear(), "yyyy"));
            if (startYear <= currYear && startYear >= 1900){
                self.statusMessage("");
                self.getBiomarkerScores();
            } else {
                self.statusMessage("Invalid year. " + startYear + " " + currYear);
            }
        });

        self.labelsMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        self.labelsYear = [];

        self.userData = {
            labels: self.labelsMonth,
            datasets: [
                {
                    label: "Average Coinstream",
                    backgroundColor: "rgba(220,220,220,0.2)",
                    borderColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: [56.52, 55.33, 53.7, 56.07, 59.44, 60.78, 61.44, 64.07, 63.26, 61.63, 58.33, 58.13]
                },
                {
                    label: "Your Coinstream",
                    backgroundColor: "rgba(151,187,205,0.2)",
                    borderColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: []
                }
            ]
        };

        self.coinstreamData = ko.observable(self.userData);

        self.statusMessage = ko.observable("");
    };

    coinstreamType.prototype.refresh = function(){
        var self = this;
        if (self.wallet.User().profile){
            self.name(self.wallet.User().profile.name);
            self.role(self.wallet.User().profile.role);
            if (typeof self.userData.datasets[1].data !== 'undefined' &&
                self.userData.datasets[1].data.length === 0){
                self.getBiomarkerScores(); // Pull if no data yet.
            }
        }
    };

    coinstreamType.prototype.Refresh = function(){
        var self = this;
        self.userData.datasets[1].data = []; // Reset data so it will refresh
        self.getBiomarkerScores(true);
    };

    coinstreamType.prototype.getBiomarkerScores = function(refresh){
        var self = this;
        var id = self.wallet.User()._id;
        var startYear = Date(self.startYear() + '-01-01');
        var getBiomarkerScoresCommand = new Command('getbiomarkerscores',
                                                [encodeURIComponent(btoa(id)), encodeURIComponent(startYear)],
                                                self.wallet.settings().chRoot,
                                                self.wallet.settings().env);
        $.when(getBiomarkerScoresCommand.execute())
            .done(function(data){
                if (data && data.length){
                    //console.log("DEBUG: data = " + JSON.stringify(data));
                    var dates = [];
                    var scores = [];
                    for(var i = 0; i < data.length; i++) {
                        var biomarker = data[i].biomarker;
                        var header = data[i].header;
                        if (biomarker && header && header.user_id === id){
                            // Dates returned oldest to newest.
                            dates.push(Dateformat(biomarker.Date, "yyyy-mm-dd"));
                            scores.push(biomarker.Score);
                        }
                    }
                    console.log("DEBUG: in dates = " + JSON.stringify(dates));
                    console.log("DEBUG: in scores = " + JSON.stringify(scores));
                    if (scores.length && dates.length){
                        var currYear = Dateformat(Date.now(), "yyyy");
                        var startYear = Dateformat(dates[0], "yyyy");
                        // Determine which labels to use.
                        if (startYear < currYear){
                            // Build 12 Year labels
                            var offset = currYear - startYear;
                            if (offset > 12){
                                currYear = currYear - offset + 12;
                            } else {
                                currYear = currYear + 12 - offset;
                            }
                            offset = 12;
                            for(var year = currYear - offset; year < currYear; year++) {
                                self.labelsYear.push(year);
                            }
                            self.userData.labels = self.labelsYear;
                        } else {
                            // Use Month labels
                            self.userData.labels = self.labelsMonth;
                        }
                        // There may be less than 12 scores, but we start at beginning of chart
                        var dataPoints = [0,0,0,0,0,0,0,0,0,0,0,0];
                        for (var dp = 0; dp < dates.length; dp++){
                            if (startYear === currYear){ // 12 months view
                                var mo = Number(Dateformat(dates[dp], "mm"));
                                dataPoints[mo - 1] = scores[dp];
                            } else { // 12 years view
                                var yr = Number(Dateformat(dates[dp], "yyyy")) - startYear;
                                dataPoints[yr] = scores[dp];
                            }
                        }
                        self.userData.datasets[1].data = dataPoints;
                        console.log("DEBUG: out scores = " + JSON.stringify(self.userData.datasets[1].data));

                        self.coinstreamData(self.userData);
                        if (!refresh){
                            self.statusMessage("You've got Biomarkers!");
                        } else {
                            self.statusMessage("Biomarkers Refreshed.");
                        }
                    } else {
                        self.statusMessage("No Biomarkers scores were found.");
                    }
                } else {
                    self.statusMessage("No Biomarkers were found since " + Dateformat(self.startYear(), "yyyy") + ".");
                }
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Biomarker Retrieve Error!");
            });
    };

    return coinstreamType;
});
