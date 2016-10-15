define(['knockout',
        'viewmodels/wallet-status'], function(ko,WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.User = ko.observable("");
    };

    profileType.prototype.load = function(User){
        var self = this;
        if (self.User() === "")
            self.User(User); // First time load
    };

    return profileType;
});
