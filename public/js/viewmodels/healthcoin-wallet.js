define(['knockout',
    'common/dialog',
    'viewmodels/wallet-status',
    'viewmodels/biomarkers/biomarkers',
    'viewmodels/send/send',
    'viewmodels/receive/receive',
    'viewmodels/history/history',
    'viewmodels/console/console',
    'viewmodels/profile/profile',
    'bindinghandlers/modal',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command'], function(ko, dialog, WalletStatus, Biomarkers, Send, Receive, History, Console, Profile, Modal, WalletPassphrase, Command){

    var walletType = function(){
        var self = this;

        self.currentView = ko.observable('biomarkers');
        self.sidebarToggled = ko.observable(false);
        self.encryptionStatus = ko.observable(-1);

        self.User = ko.observable({});
        self.getUserAccount();

        self.walletStatus = new WalletStatus();
        self.walletStatus.getNodeInfo();

        self.biomarkers = new Biomarkers({parent: self});
        self.send = new Send({parent: self});
        self.receive = new Receive({parent: self});
        self.history = new History({parent: self});
        self.console = new Console({parent: self});
        self.profile = new Profile({parent: self});

        self.timeout = 1000;

        self.pollWalletStatus();
    };

    // Called once at startup.
    walletType.prototype.getUserAccount = function(){
        var self = this,
            getUserAccountCommand = new Command('getuseraccount',[]);
        var userPromise = $.when(getUserAccountCommand.execute())
            .done(function(getUserAccountData){
                if (typeof getUserAccountData.User !== 'undefined')
                    self.User(getUserAccountData.User);
                //console.log('DEBUG: User: ' + JSON.stringify(self.User()));
            });
        return userPromise;
    };

    walletType.prototype.refresh = function(){
        var self = this, refreshPromise = "";
        refreshPromise = $.when(self.walletStatus.load(self.User()),
                      self.biomarkers.load(self.User()),
                      self.history.load(self.User()),
                      self.receive.load(self.User()),
                      self.profile.load(self.User(), self.walletStatus.node_id()));
        return refreshPromise;
    };

    walletType.prototype.pollWalletStatus = function(){
        var self = this;
        setTimeout(function(){
            self.refresh().then(function(){
                if (self.timeout < 60000){ // First timeout
                    self.timeout = 60000;
                    // One-time call after getinfo
                    self.checkEncryptionStatus();
                }
                self.pollWalletStatus();
            });
        },self.timeout);
    };

    walletType.prototype.unlockWallet = function(){
        var self = this;
        if (self.walletStatus.isLocalWallet()){
            new WalletPassphrase({canSpecifyStaking: true}).userPrompt(false, 'Wallet unlock', 'This action will unlock the wallet for sending or staking','OK')
            .done(function(result){
                //console.log(result);
                self.walletStatus.load(self.User());
                result.passphrase = "XXXXXXXX"; // Clear password in memory
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
                self.walletStatus.load(self.User());
            });
        }
    };

    walletType.prototype.lockWallet = function(){
        var self = this;
        if (self.walletStatus.isLocalWallet()){
            var walletLockCommand = new Command('walletlock',[]).execute()
            .done(function(){
                dialog.notification("Wallet is now locked. To send transactions or stake you must unlock the wallet.");
                self.walletStatus.load(self.User());
            })
            .fail(function(){
                dialog.notification("Wallet is already locked.");
                self.walletStatus.load(self.User());
            });
        }
    };

    walletType.prototype.checkEncryptionStatus = function(){
        var self = this;
        if (self.walletStatus.isLocalWallet()){
            var getInfoCommand = new Command('getinfo',[]);
            var statusPromise = $.when(getInfoCommand.execute())
            .done(function(getInfoData){
                self.encryptionStatus(typeof getInfoData.unlocked_until !== 'undefined' ? getInfoData.unlocked_until : -1);
                switch(self.encryptionStatus()){
                case -1: // wallet is unencrypted
                    self.promptToEncrypt();
                    break;
                case 0: // wallet is locked
                    self.promptToUnlockForStaking();
                    break;
                default: // wallet is already unlocked for staking
                    break;
                }
            });
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
                console.log(result);
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
            });
    };

    walletType.prototype.toggleSidebar = function(){
        this.sidebarToggled(!this.sidebarToggled());
    };

    return walletType; 
});
