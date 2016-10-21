define(['knockout',
        'viewmodels/wallet-status'], function(ko,WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.User = ko.observable("");
        self.active_wallet = ko.observable("");
    };

    profileType.prototype.load = function(User, node_id){
        var self = this;
        if (self.User() === "")
            self.User(User); // First time load
			// Get the wallet for the node_id
            var found = false;
			var wallet = User.wallet.filter(function(wal){
				if(!found && wal.node_id === node_id){
                    found = true;
                    self.active_wallet(wal);
					return wal;
				}
            });
			if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
    };

    return profileType;
});
