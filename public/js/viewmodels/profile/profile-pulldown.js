define(['knockout'], function(ko){
    var pulldownType = function(){

        this.genderValues = ko.observableArray(["",
            "Female",
            "Male"
            ]);

        this.ethnicityValues = ko.observableArray(["",
            "Non-Hispanic White or Euro-American",
            "Black, Afro-Caribbean, or African American",
            "Latino or Hispanic American",
            "East Asian or Asian American",
            "South Asian or Indian American",
            "Middle Eastern or Arab American",
            "Native American or Alaskan Native",
            "Other"
            ]);

        this.countryValues = ko.observableArray(["",
            "United States",
            "Canada",
            "Mexico"
            ]);

    };
    return pulldownType; 
});
