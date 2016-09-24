Number.prototype.formatMoney = function(c, d, t){
        var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

define(['knockout','viewmodels/common/command'],function(ko,Command){
    var walletStatusType = function(){
        var self = this;
        self.total = ko.observable(0);
        self.stake = ko.observable(0);
        self.isLoadingStatus = ko.observable(false);
        self.blocks = ko.observable(0);
        self.totalBlocks = ko.observable(0);
        self.isEnabled = ko.observable("No");
        self.isStaking = ko.observable("No");
        self.isEncrypted = ko.observable("No");
        self.isUnlocked = ko.observable("No");
        self.totalFmt = ko.pureComputed(function(){return (self.total()).formatMoney(2, '.', ',');});
        self.stakeFmt = ko.pureComputed(function(){return (self.stake()).formatMoney(2, '.', ',');});
        self.availableFmt = ko.pureComputed(function(){return (self.total() - self.stake()).formatMoney(2, '.', ',');});
        this.available = ko.pureComputed(function(){
            var total = self.total(), stake = self.stake();
            return (total - stake);
        }).extend({ rateLimit: 500 });
    };

    walletStatusType.prototype.load = function(){
        var self = this,
            getInfoCommand = new Command('getinfo',[]), 
            getBlockCountCommand = new Command('getblockcount',[]),
            getStakingInfoCommand = new Command('getstakinginfo',[]);
        self.isLoadingStatus(true);
        var statusPromise = $.when(getInfoCommand.execute(), getBlockCountCommand.execute(), getStakingInfoCommand.execute())
            .done(function(getInfoData, getBlockCountData, getStakingInfoData){
                console.log(getInfoData);
                console.log(getStakingInfoData);
                self.stake(getInfoData.stake);
                self.total(getInfoData.balance + self.stake());
                self.blocks(getInfoData.blocks);
                self.totalBlocks(getBlockCountData);
                self.isEnabled(getStakingInfoData.Enabled ? "Yes" : "No");
                self.isStaking(getStakingInfoData.Staking ? "Yes" : "No");
                self.isEncrypted(typeof getInfoData.unlocked_until !== 'undefined' ? "Yes" : "No");
                if (typeof getInfoData.unlocked_until !== 'undefined' && getInfoData.unlocked_until > 0){
                    self.isUnlocked("Yes");
                }else{
                    self.isUnlocked("No");
                }
                self.isLoadingStatus(false); 
            });
        //console.log('statusPromise:');
        //console.log(statusPromise);
        return statusPromise;
    };

    return walletStatusType;
});
