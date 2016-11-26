define(['knockout',
    'viewmodels/common/command'], function(ko,Command){
    var walletStatusType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.total = ko.observable(0.0);
        self.stake = ko.observable(0.0);
        self.isLoadingStatus = ko.observable(false);
        self.blocks = ko.observable(0);
        self.isEnabled = ko.observable("No");
        self.isStaking = ko.observable("No");
        self.isEncrypted = ko.observable("No");
        self.isUnlocked = ko.observable("No");
        self.unlockedUntil = ko.observable(-1);
        self.isLocalWallet = ko.observable(false); // Is the node local?
        self.node_id = ko.observable("127.0.0.1"); // wallet node host/IP
        self.account = ko.observable("");          // Current User account

        self.totalFmt = ko.pureComputed(function(){return self.wallet.formatNumber(self.total(), 2, '.', ',');});
        self.stakeFmt = ko.pureComputed(function(){return self.wallet.formatNumber(self.stake(), 2, '.', ',');});
        self.availableFmt = ko.pureComputed(function(){return self.wallet.formatNumber(self.total() - self.stake(), 2, '.', ',');});

        this.available = ko.pureComputed(function(){
            var total = self.total(), stake = self.stake();
            return (total - stake);
        }).extend({ rateLimit: 500 });
 
        this.encryptionStatus = ko.pureComputed(function(){
            return (self.isEncrypted() === "Yes");
        }).extend({ rateLimit: 500 });
    };

    // Called once at startup.
    walletStatusType.prototype.getNodeInfo = function(){
        var self = this,
            getNodeInfoCommand = new Command('getnodeinfo',[]);
        var statusPromise = $.when(getNodeInfoCommand.execute())
            .done(function(getNodeInfoData){
                if (typeof getNodeInfoData.isLocal !== 'undefined'){
                    self.isLocalWallet(getNodeInfoData.isLocal);
                    self.node_id(getNodeInfoData.node_id);
                }
            });
        return statusPromise;
    };

    walletStatusType.prototype.refresh = function(account){
        var self = this;
        self.account(account !== "" ? account : "*");
        var getInfoCommand = new Command('getinfo',[]),
            getBalanceCommand = new Command('getbalance',[self.account()]),
            getStakingInfoCommand = new Command('getstakinginfo',[]);
        self.isLoadingStatus(true);
        var statusPromise = $.when(getInfoCommand.execute(), getBalanceCommand.execute(), getStakingInfoCommand.execute())
            .done(function(getInfoData, getBalanceData, getStakingInfoData){
                if (typeof getInfoData.unlocked_until !== 'undefined'){
                    self.unlockedUntil(getInfoData.unlocked_until);
                    self.isEncrypted("Yes");
                    if (self.unlockedUntil() > 0){
                        self.isUnlocked("Yes");
                    } else {
                        self.isUnlocked("No");
                    }
                }
                if (self.account() === "MASTER_ACCOUNT"){
                    self.stake(getInfoData.stake);
                    self.total(getInfoData.balance + self.stake());
                } else {
                    // Only show details related to user account
                    self.stake(0);
                    self.total((!isNaN(getBalanceData) ? getBalanceData : 0));
                }
                self.blocks(getInfoData.blocks);
                self.isEnabled(getStakingInfoData.Enabled ? "Yes" : "No");
                self.isStaking(getStakingInfoData.Staking ? "Yes" : "No");
                self.isLoadingStatus(false); 
            });
        return statusPromise;
    };

    return walletStatusType;
});
