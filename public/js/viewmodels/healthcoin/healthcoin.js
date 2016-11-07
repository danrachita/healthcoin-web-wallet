define(['knockout'], function(ko){
    var healthcoinType = function(options){
        var self = this, opts = options || {};
        self.wallet = opts.parent;

        self.User = ko.observable("");
        self.node_id = ko.observable("");
        self.role = ko.observable("");
        self.name = ko.observable("");

        self.statusMessage = ko.observable("");

        healthcoinType.prototype.profileComplete = function(){
            var self = this;
            var isComplete = false;
            if (self.User().profile) {
                isComplete = self.User().profile.age > 0 &&
                             self.User().profile.weight > 0 &&
                             self.User().profile.waist > 0 &&
                             self.User().profile.gender !== "" &&
                             self.User().profile.ethnicity !== "" &&
                             self.User().profile.country !== "";
            }
            return isComplete;
        };

    };

    healthcoinType.prototype.load = function(User, node_id){
        var self = this;
        if (User && node_id){
            self.User(User);
            self.node_id(node_id);
            self.role(User.profile.role);
            self.name(User.profile.name);
        }
        if (!this.profileComplete()){
                self.statusMessage("Please complete your profile before continuing.");
        }
    };

    return healthcoinType;
});
