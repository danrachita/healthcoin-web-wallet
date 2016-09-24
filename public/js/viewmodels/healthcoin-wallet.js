define(['knockout','common/dialog','viewmodels/wallet-status','viewmodels/healthcoin/healthcoin','viewmodels/send/send','viewmodels/receive/receive','viewmodels/history/history','viewmodels/console/console', 'bindinghandlers/modal','viewmodels/common/wallet-passphrase', 'viewmodels/common/command'], 
function(ko, dialog, WalletStatus, Healthcoin, Send, Receive, History, Console, Modal, WalletPassphrase, Command){

    var walletType = function(){
        var self = this;
        self.healthcoinTotal = ko.observable(0);
        self.healthcoinAvailable = ko.observable(0);
        self.healthcoinStaking = ko.observable(0);
        self.currentView = ko.observable('healthcoin');
        self.sidebarToggled = ko.observable(false);
        self.isEncrypted = ko.observable(-1);
        self.walletStatus = new WalletStatus({parent: self});
        self.healthcoin = new Healthcoin({parent: self});
        self.send = new Send({parent: self});
        self.receive = new Receive({parent: self});
        self.history = new History({parent: self});
        self.console = new Console({parent: self});
        self.refresh();
        self.pollWalletStatus();
        self.checkEncryptionStatus();
    };

    walletType.prototype.unlockWallet = function(){
        var self = this;
        new WalletPassphrase({canSpecifyStaking: true}).userPrompt(false, 'Wallet unlock', 'This action will unlock the wallet for sending or staking','OK')
            .done(function(result){
                //console.log(result);
                self.walletStatus.load();
                result.passphrase = "xxxxxxxx"; // Clear password in memory
            })
            .fail(function(error){
                console.log(error);
                dialog.notification(error.message);
                self.walletStatus.load();
            });
    };

    walletType.prototype.lockWallet = function(){
        var self = this;
        var walletLockCommand = new Command('walletlock',[]).execute()
            .done(function(){
                dialog.notification("Wallet is now locked. To send transactions or stake you must unlock the wallet.");
                self.walletStatus.load();
            })
            .fail(function(){
                dialog.notification("Wallet is already locked.");
                self.walletStatus.load();
            });
    };

    walletType.prototype.toggleSidebar = function(){
        this.sidebarToggled(!this.sidebarToggled());
    };

    walletType.prototype.refresh = function(refreshTargets){
        return $.when(this.walletStatus.load(), this.history.load(), this.receive.load());
    };

    walletType.prototype.pollWalletStatus = function(){
        var self = this;
        setTimeout(function(){
            self.refresh().then(function(){
                self.pollWalletStatus();
            });
        },60000);
    };

    walletType.prototype.checkEncryptionStatus = function(){
        var self = this,
        getInfoCommand = new Command('getinfo',[]);
        var statusPromise = $.when(getInfoCommand.execute())
            .done(function(getInfoData){
                self.isEncrypted(typeof getInfoData.unlocked_until !== 'undefined' ? getInfoData.unlocked_until : -1);
                switch(self.isEncrypted()){
                case -1: //wallet is unencrypted
                    self.promptToEncrypt();
                    break;
                case 0: //wallet is locked
                    self.promptToUnlockForStaking();
                    break;
                default: //wallet is already unlocked for staking
                    break;
            }
        });
    };

    walletType.prototype.promptToEncrypt = function(){
        new WalletPassphrase().userPrompt(true,'Encrypt', 'Encrypt','OK')
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

    return walletType; 
});
