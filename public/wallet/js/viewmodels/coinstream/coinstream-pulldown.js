define(['knockout'], function(ko){
    var pulldownType = function(){

        this.chartStyleValues = ko.observableArray(["",
            "Line",
            "Bar"
            ]);

    };
    return pulldownType; 
});
