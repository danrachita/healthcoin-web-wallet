define(['knockout'], function(ko){
    var exploreType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.role = ko.observable("");

        self.statusMessage = ko.observable("");
    };

    exploreType.prototype.refresh = function(){
        var self = this;
        // Add short delay to healthcoin-wallet's initial short timeout
        setTimeout(function(){
            if (self.wallet.User().profile){
                self.role(self.wallet.User().profile.role);
            }
        },2000);
    };

    return exploreType;
});
