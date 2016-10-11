define(['knockout',
        'viewmodels/wallet-status'], function(WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;
        account = self.wallet.walletStatus.hcn_account; // hcn_account is ko.observable
        address = self.wallet.walletStatus.hcn_address; // hcn_account is ko.observable
    };
    return profileType;
});
