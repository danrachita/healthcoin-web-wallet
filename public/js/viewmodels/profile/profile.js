define(['knockout',
        'viewmodels/common/command',
        'viewmodels/wallet-status'], function(ko,Command){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.User = ko.observable({});
        self.login_type = ko.observable("");
        self.login_id = ko.observable("");
        self.role = ko.observable("");

        // User changeables
        self.name = ko.observable("");
        self.email = ko.observable("");
        self.description = ko.observable("");
        self.age = ko.observable("");
        self.weight = ko.observable("");
        self.waist = ko.observable("");
        self.gender = ko.observable("");
        self.ethnicity = ko.observable("");
        self.country = ko.observable("");

        self.credit = ko.observable("");
        self.wallets = ko.observableArray([]);
        self.active_wallet = ko.observable("");
        self.node_id = ko.observable("");

        self.dirtyFlag = ko.observable(false);
        self.isDirty = ko.computed(function() {
            //console.log("DEBUG: isDirty: " + (self.dirtyFlag() ? "true" : "false"));
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
    };

    profileType.prototype.load = function(User, node_id){
        var self = this;
        if (User && node_id){
            self.User(User);
            self.login_type(User.profile.login_type);
            switch(self.login_type()){
                case ("local"):
                    self.login_id(User.local.id);
                    break;
                case ("facebook"):
                    self.login_id(User.facebook.id);
                    break;
                case ("google"):
                    self.login_id(User.google.id);
                    break;
                case ("twitter"):
                    self.login_id(User.twitter.id);
                    break;
                default:
                    break;
            }
            self.role(User.profile.role);
            self.name(User.profile.name);
            self.email(User.profile.email);
            self.description(User.profile.description);
            self.age(User.profile.age);
            self.weight(User.profile.weight);
            self.waist(User.profile.waist);
            self.gender(User.profile.gender);
            self.ethnicity(User.profile.ethnicity);
            self.country(User.profile.country);
            self.credit(User.profile.credit);
            self.wallets(User.wallet);
			// Get the wallet for the current node_id
            var found = false;
			var wallet = User.wallet.filter(function(wal){
				if(!found && wal.node_id === node_id){
                    found = true;
                    self.active_wallet(wal);
                    self.node_id(node_id);
					return wal;
				}
            });
			if (!wallet)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
        }
        self.dirtyFlag(false);
    };

    profileType.prototype.refresh = function(){
        var self = this;
        // TODO: Allow the user to select a node_id if they have more than one.
        // Refresh the wallet for the selected node_id
        var found = false;
        var wallet = self.wallets().filter(function(wal){
            if(!found && wal.node_id === self.node_id()){ // Future: Make a drop down of selectable node_id's
                found = true;
                self.active_wallet(wal);
                return wal;
            }
        });
        if (!wallet)
            console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
    };

    profileType.prototype.Reset = function(){
        var self = this;
        this.load(self.User(), self.node_id());
    };

    profileType.prototype.Submit = function(){
        var self = this;
        // Save User changeables
        self.User().profile.name = self.name();
        self.User().profile.email = self.email();
        self.User().profile.description = self.description();
        self.User().profile.age = self.age();
        self.User().profile.weight = self.weight();
        self.User().profile.waist = self.waist();
        self.User().profile.gender = self.gender();
        self.User().profile.ethnicity = self.ethnicity();
        self.User().profile.country = self.country();
        var saveUserProfileCommand = new Command('saveuserprofile',
            [encodeURIComponent(btoa(JSON.stringify(self.User().profile)))]).execute()
            .done(function(){
                console.log("User Profile saved!");
                self.dirtyFlag(false);
            });
    };

    return profileType;
});
