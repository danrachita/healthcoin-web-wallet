define(['knockout',
        'viewmodels/wallet-status'], function(ko,WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        this.User = ko.observable("");
    };

    profileType.prototype.load = function(User){
        if (this.User() === "")
            this.User(User); // First time load
        console.log('DEBUG: this.User: ' + JSON.stringify(this.User));
    };

    return profileType;
});
