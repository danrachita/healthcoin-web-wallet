define(['knockout',
        'viewmodels/wallet-status'], function(ko,WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.User = ko.observable("");
        self.wallet = ko.observable([]);
    };

    profileType.prototype.load = function(User, walletNode){
        var self = this;
        if (self.User() === "")
            self.User(User); // First time load
			// Get the hcn_address for the hcn_node_id
			var wallet = User.wallet.filter(function(wal){
				if(wal.hcn_node_id === walletNode)
					return wal;
            });
			if (wallet.length)
                self.wallet(wallet);
    };

    return profileType;
});
