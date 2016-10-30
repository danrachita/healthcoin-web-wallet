define(['knockout',
        'viewmodels/common/transaction',
        'viewmodels/wallet-status',
        'viewmodels/common/command'], function(ko,Transaction,WalletStatus,Command){
        var exploreType = function(options){
            var self = this, opts = options || {};
            self.wallet = opts.parent;

            self.role = ko.observable("");
        };

        exploreType.prototype.load = function(User, node_id){
            var self = this;
            if (self.role() === ""){
                self.role(User.profile.role);
            }
        };

        return exploreType;
    });
