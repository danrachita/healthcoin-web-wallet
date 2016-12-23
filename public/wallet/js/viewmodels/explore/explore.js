define(['knockout'], function(ko){
    var exploreType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.statusMessage = ko.observable("");

        self.role = ko.observable("");
        self.explorerURL = ko.observable("https://explorer.healthcoin.com/");
    };

    exploreType.prototype.refresh = function(){
        var self = this;
        if (self.wallet.User().profile){
            self.role(self.wallet.User().profile.role);
        }
    };

    return exploreType;
});
