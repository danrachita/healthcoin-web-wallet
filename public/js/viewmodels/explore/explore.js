define(['knockout'], function(ko){
    var exploreType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.role = ko.observable("");

        self.statusMessage = ko.observable("");
    };

    exploreType.prototype.refresh = function(){
        var self = this;
        if (self.wallet.User().profile){
            self.role(self.wallet.User().profile.role);
        }
    };

    return exploreType;
});
