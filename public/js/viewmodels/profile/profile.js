define(['knockout',
        'viewmodels/common/command',
        'viewmodels/wallet-status'], function(ko,Command){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.node_id = ko.observable("");
        self.account = ko.observable("");
        self.address = ko.observable("");

        self.role = ko.observable("");
        self.login_type = ko.observable("");
        self.login_id = ko.observable("");
        self.credit = ko.observable(0.0000);
        self.creditFmt = ko.pureComputed(function(){return self.wallet.formatNumber(self.credit(), 4, '.', ',');});
        self.facebookUrl = ko.observable("https://facebook.com/");
        self.googleUrl = ko.observable("https://plus.google.com/");
        self.twitterUrl = ko.observable("https://twitter.com/");

        // User changeables
        self.name = ko.observable("");
        self.email = ko.observable("");
        self.description = ko.observable("");
        self.age = ko.observable("");
        self.weight = ko.observable("");
        self.waist = ko.observable("");
        self.gender = ko.observable("");
        self.genderValues = ko.observableArray(["",
                                    "Female",
                                    "Male"
                                    ]);
        self.ethnicity = ko.observable("");
        self.ethnicityValues = ko.observableArray(["",
                                    "Non-Hispanic White or Euro-American",
                                    "Black, Afro-Caribbean, or African American",
                                    "Latino or Hispanic American",
                                    "East Asian or Asian American",
                                    "South Asian or Indian American",
                                    "Middle Eastern or Arab American",
                                    "Native American or Alaskan Native",
                                    "Other"
                                    ]);
        self.country = ko.observable("");
        self.countryValues = ko.observableArray(["",
                                    "United States",
                                    "Canada",
                                    "Mexico"
                                    ]);

        self.dirtyFlag = ko.observable(false);
        self.isDirty = ko.computed(function() {
            return self.dirtyFlag();
        });

        // User changeables subscriptions
        self.name.subscribe(function (){self.dirtyFlag(true);});
        self.email.subscribe(function (){self.dirtyFlag(true);});
        self.description.subscribe(function (){self.dirtyFlag(true);});
        self.age.subscribe(function (){self.dirtyFlag(true);});
        self.weight.subscribe(function (){self.dirtyFlag(true);});
        self.waist.subscribe(function (){self.dirtyFlag(true);});
        self.gender.subscribe(function (){self.dirtyFlag(true);});
        self.ethnicity.subscribe(function (){self.dirtyFlag(true);});
        self.country.subscribe(function (){self.dirtyFlag(true);});

        self.canSubmit = ko.computed(function(){
            var canSubmit = self.name() !== "" &&
                          self.email() !== "" &&
                          self.age() > 0 &&
                          self.weight() > 0 &&
                          self.waist() > 0 &&
                          self.gender() !== "" &&
                          self.ethnicity() !== "" &&
                          self.country() !== "";
            return canSubmit;
        });

        self.statusMessage = ko.observable("");
    };

    profileType.prototype.refresh = function(){
        var self = this;
        if (!self.isDirty() && self.wallet.User().profile){
            self.login_type(self.wallet.User().profile.login_type);
            switch(self.login_type()){
                case ("local"):
                    self.login_id(self.wallet.User().local.id);
                    break;
                case ("facebook"):
                    self.login_id(self.wallet.User().facebook.id);
                    break;
                case ("google"):
                    self.login_id(self.wallet.User().google.id);
                    break;
                case ("twitter"):
                    self.login_id(self.wallet.User().twitter.id);
                    break;
                default:
                    break;
            }
            self.node_id(self.wallet.node_id());
            self.account(self.wallet.account());
            self.address(self.wallet.address());

            self.role(self.wallet.User().profile.role);
            self.name(self.wallet.User().profile.name);
            self.email(self.wallet.User().profile.email);
            self.description(self.wallet.User().profile.description);
            self.age(self.wallet.User().profile.age);
            self.weight(self.wallet.User().profile.weight);
            self.waist(self.wallet.User().profile.waist);
            self.gender(self.wallet.User().profile.gender);
            self.ethnicity(self.wallet.User().profile.ethnicity);
            self.country(self.wallet.User().profile.country);
            self.credit(self.wallet.User().profile.credit);

            if (!self.wallet.profileComplete()){
                self.statusMessage("Please complete your profile before continuing.");
            }
            self.dirtyFlag(false);
        }
    };

    profileType.prototype.Reset = function(){
        var self = this;
        self.dirtyFlag(false);
        this.refresh();
    };

    profileType.prototype.Submit = function(){
        var self = this;
        // Save User changeables
        self.wallet.User().profile.name = self.name();
        self.wallet.User().profile.email = self.email();
        self.wallet.User().profile.description = self.description();
        self.wallet.User().profile.age = self.age();
        self.wallet.User().profile.weight = self.weight();
        self.wallet.User().profile.waist = self.waist();
        self.wallet.User().profile.gender = self.gender();
        self.wallet.User().profile.ethnicity = self.ethnicity();
        self.wallet.User().profile.country = self.country();
        var saveUserProfileCommand = new Command('saveuserprofile',
                                                [encodeURIComponent(btoa(JSON.stringify(self.wallet.User().profile)))],
                                                self.wallet.settings().env).execute()
            .done(function(){
                console.log("Profile Saved!");
                self.statusMessage("Profile Saved!");
                self.dirtyFlag(false);
            })
            .fail(function(error){
                console.log("Error:" + error.toString());
                self.statusMessage("Save Error!");
            });
    };

    return profileType;
});
