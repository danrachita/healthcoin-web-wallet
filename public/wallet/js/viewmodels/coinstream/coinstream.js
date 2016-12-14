define(['knockout'], function(ko){
    var coinstreamType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.name = ko.observable("");
        self.role = ko.observable("");

        self.coinstreamData = ko.observable({
            labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            datasets: [
                {
                    label: "Normal Biomarkers",
                    backgroundColor: "rgba(220,220,220,0.2)",
                    borderColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: [5.52, 5.33, 5.7, 6.07, 6.44, 4.78, 6.44, 6.07, 6.26, 6.63, 5.33, 6.44]
                },
                {
                    label: "Your Biomarkers",
                    backgroundColor: "rgba(151,187,205,0.2)",
                    borderColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: [4.41, 4.59, 4.78, 4.96, 5.15, 5.33, 5.52, 5.7, 5.89, 6.07, 6.26, 6.44]
                }
            ]
        });

        self.statusMessage = ko.observable("");
    };

    coinstreamType.prototype.refresh = function(){
        var self = this;
        if (self.wallet.User().profile){
            self.name(self.wallet.User().profile.name);
            self.role(self.wallet.User().profile.role);
        }
    };

    return coinstreamType;
});
