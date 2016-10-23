define(['knockout',
        'viewmodels/wallet-status'], function(ko,WalletStatus){
    var profileType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.User = ko.observable("");
        self.active_wallet = ko.observable("");
        self.node_id = ko.observable("");
    };

    profileType.prototype.load = function(User, node_id){
        var self = this;
        if (self.User() === "")
            self.User(User);
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
    };

    profileType.prototype.refresh = function(){
        var self = this;
        // TODO: Allow the user to select a node_id if they have more than one.
        // Refresh the wallet for the selected node_id
        var found = false;
        var wallet = self.User().wallet.filter(function(wal){
            if(!found && wal.node_id === self.node_id()){ // Future: Make a drop down of selectable node_id's
                found = true;
                self.active_wallet(wal);
                return wal;
            }
        });
        if (!wallet)
            console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
    };

    return profileType;
});
