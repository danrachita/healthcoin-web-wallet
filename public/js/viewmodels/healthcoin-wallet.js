Number.prototype.formatNumber = function(p, d, c){
        var n = this,
        p = isNaN(p = Math.abs(p)) ? 2 : p,
        d = d === undefined ? "." : d,
        c = c === undefined ? "," : c,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(p)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + (j ? i.substr(0, j) + c : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + c) + (p ? d + Math.abs(n - i).toFixed(p).slice(2) : "");
};

define(['knockout',
    'common/dialog',
    'viewmodels/wallet-status',
    'viewmodels/healthcoin/healthcoin',
    'viewmodels/biomarkers/biomarkers',
    'viewmodels/send/send',
    'viewmodels/receive/receive',
    'viewmodels/history/history',
    'viewmodels/explore/explore',
    'viewmodels/console/console',
    'viewmodels/profile/profile',
    'bindinghandlers/modal',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command'], function(ko, dialog, WalletStatus, Healthcoin, Biomarkers, Send, Receive, History, Explore, Console, Profile, Modal, WalletPassphrase, Command){

    var walletType = function(){
        var self = this;

        self.sessionTimeout = ko.observable(2 * 60 * 60 * 1000); // Application session timeout = 2 Hours between change of views.
        self.sessionExpires = ko.observable(Date.now() + self.sessionTimeout());

        self.currentView = ko.observable('healthcoin');
        self.sidebarToggled = ko.observable(true);

        self.User = ko.observable({});
        self.account = ko.observable("");
        self.role = ko.observable("");
        self.getUserAccount();

        self.walletStatus = new WalletStatus({parent: self});
        self.walletStatus.getNodeInfo();

        self.healthcoin = new Healthcoin({parent: self});
        self.biomarkers = new Biomarkers({parent: self});
        self.send = new Send({parent: self});
        self.receive = new Receive({parent: self});
        self.history = new History({parent: self});
        self.explore = new Explore({parent: self});
        self.console = new Console({parent: self});
        self.profile = new Profile({parent: self});

        self.currentView.subscribe(function (){
            self.sessionExpires(Date.now() + self.sessionTimeout());
        });

        self.timeout = 1000;

        self.pollWalletStatus();
    };

    // Called once at startup.
    walletType.prototype.getUserAccount = function(){
        var self = this,
            getUserAccountCommand = new Command('getuseraccount',[]); // Get the User from the session
        var userPromise = $.when(getUserAccountCommand.execute())
            .done(function(getUserAccountData){
                if (typeof getUserAccountData.User !== 'undefined'){
                    self.User(getUserAccountData.User);
                    self.account(self.User().wallet[0].account);
                    self.role(self.User().profile.role);
                }
                //console.log('DEBUG: User: ' + JSON.stringify(self.User()));
            });
        return userPromise;
    };

    walletType.prototype.refresh = function(){
        var self = this, refreshPromise = "";
        if (self.timeout < 60000){ // First timeout
            refreshPromise = $.when(self.walletStatus.refresh(self.account()),
                                    self.healthcoin.load(self.User(), self.walletStatus.node_id()),
                                    self.biomarkers.load(self.User(), self.walletStatus.node_id()),
                                    self.send.load(self.User(), self.walletStatus.node_id()),
                                    self.receive.load(self.User(), self.walletStatus.node_id()),
                                    self.history.load(self.User(), self.walletStatus.node_id()),
                                    self.explore.load(self.User(), self.walletStatus.node_id()),
                                    self.console.load(self.User(), self.walletStatus.node_id()),
                                    self.profile.load(self.User(), self.walletStatus.node_id()));
        } else {
            refreshPromise = $.when(self.walletStatus.refresh(self.account()),
                                    self.send.refresh(),
                                    self.receive.refresh(),
                                    self.history.refresh());
        }
        return refreshPromise;
    };

    walletType.prototype.pollWalletStatus = function(){
        var self = this;
        setTimeout(function(){
            if (Date.now() <= self.sessionExpires()){
                self.refresh().then(function(){
                    if (self.timeout < 60000){ // First timeout
                        self.timeout = 60000;
                        // One-time call after first refresh
                        self.checkEncryptionStatus();
                    }
                    self.pollWalletStatus();
                });
            } else {
                console.log("Session Expired. Polling stopped.");
                // TODO: Prompt for the user to continue, but timeout after 1 minute if no response.
                window.location = '/logout';
            }
        },self.timeout);
    };

    walletType.prototype.unlockWallet = function(){
        var self = this;
        if (self.walletStatus.isLocalWallet()){
            new WalletPassphrase({canSpecifyStaking: true}).userPrompt(false, 'Wallet unlock', 'This action will unlock the wallet for sending or staking','OK')
            .done(function(result){
                //console.log(result);
                self.walletStatus.refresh(self.account());
                result.passphrase = "XXXXXXXX"; // Clear password in memory
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
                self.walletStatus.refresh(self.account());
            });
        }
    };

    walletType.prototype.lockWallet = function(){
        var self = this;
        if (self.walletStatus.isLocalWallet()){
            var walletLockCommand = new Command('walletlock',[]).execute()
            .done(function(){
                dialog.notification("Wallet is now locked. To send transactions or stake you must unlock the wallet.");
                self.walletStatus.refresh(self.account());
            })
            .fail(function(){
                dialog.notification("Wallet is already locked.");
                self.walletStatus.refresh(self.account());
            });
        }
    };

    walletType.prototype.checkEncryptionStatus = function(){
        var self = this;
        // DO NOT allow non-local wallets to be encrypted!
        // A wallet is local if the healthcoin.conf file has the parameter:
        // rpcconnect=localhost
        // - or -
        // rpcconnect=127.0.0.1
        // - or -
        // rpcconnect=hostname_with_no_tld
        //
        if (self.walletStatus.isLocalWallet()){
            switch(self.walletStatus.unlockedUntil()){
            case -1: // wallet is unencrypted
                self.promptToEncrypt();
                break;
            case 0:  // wallet is locked
                self.promptToUnlockForStaking();
                break;
            default: // 999999 - wallet is already unlocked for staking
                break;
            }
        }
    };

    walletType.prototype.promptToEncrypt = function(){
        new WalletPassphrase().userPrompt(true, 'Encrypt', 'Encrypt','OK')
            .done(function(result){
                console.log(result);
                dialog.notification("Wallet successfully encrypted. Restart your healthcoind daemon to continue.");
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
            });
    };

    walletType.prototype.promptToUnlockForStaking = function(){
        new WalletPassphrase({canSpecifyStaking: true}).userPrompt(false, 'Wallet unlock', 'Unlock the wallet','OK')
            .done(function(result){
                result.passphrase = "XXXXXXXX";
                console.log(result);
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
            });
    };

    walletType.prototype.formatNumber = function(value, precision, decimalPoint, commaSeparator){
        return value.formatNumber(precision, decimalPoint, commaSeparator);
    };

    walletType.prototype.toggleSidebar = function(){
        this.sidebarToggled(!this.sidebarToggled());
    };

    return walletType; 
});
