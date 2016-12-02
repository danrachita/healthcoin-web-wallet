define(['knockout',
        'common/dialog',
        'viewmodels/common/confirmation-dialog',
        'viewmodels/common/wallet-passphrase',
        'viewmodels/common/command',
        'patterns'], function(ko,dialog,ConfirmationDialog,WalletPassphrase,Command,patterns){
    var sendType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.recipientAddress = ko.observable("").extend( 
            { 
                pattern: { params: patterns.healthcoin, message: 'Not a valid address' },
                required: true
            });

        self.label = ko.observable("");

        self.amount = ko.observable(0.00).extend(
            { 
                number: true,
                required: true
            });
        self.available = ko.observable(0.00);
        self.maxSendAmount = ko.observable(0.00);
        self.coinsymbol = ko.observable("");

        self.minerFee = ko.observable(0.0001);

        self.canSend = ko.computed(function(){
            var address = self.recipientAddress(),
                addressValid = self.recipientAddress.isValid() && address.length > 0,
                //label = self.label,
                amount = self.amount(),
                available = self.available(),
                amountValid = !isNaN(amount) && amount > 0.00 && self.amount.isValid() && amount <= available && amount <= self.maxSendAmount();

            return addressValid && amountValid;
        });

        self.isEncrypted = ko.computed(function(){
            return (self.wallet.walletStatus.isEncrypted() === 'Yes');
        });

        self.statusMessage = ko.observable("");
    };

    sendType.prototype.refresh = function(){
        var self = this;
        // Add short delay to healthcoin-wallet's initial short timeout
        setTimeout(function(){
            self.available(self.wallet.walletStatus.available());
            self.maxSendAmount(self.wallet.settings().maxSendAmount);
            self.coinsymbol(self.wallet.settings().coinsymbol);

            self.statusMessage("Available: " + self.available() + " " + self.wallet.settings().coinsymbol + " ( Maximum send allowed: " + self.maxSendAmount() + " )");
        },2000);
    };

    sendType.prototype.lockWallet = function(){
        var self = this;
        var sendCommand = new Command('walletlock', [], self.wallet.settings().env).execute()
            .done(function(){
                console.log('Wallet relocked');
            })
            .fail(function(error){
                dialog.notification(error.message, "Failed to re-lock wallet");
            });
        return sendCommand;
    };

    sendType.prototype.unlockWallet = function(){
        var walletPassphrase = new WalletPassphrase({canSpecifyStaking:true, stakingOnly:false}),
            passphraseDialogPromise = $.Deferred();

        walletPassphrase.userPrompt(false, 'Wallet unlock', 'Unlock the wallet for sending','OK')
            .done(function(){
                passphraseDialogPromise.resolve(walletPassphrase.walletPassphrase());                            
            })
            .fail(function(error){
                passphraseDialogPromise.reject(error);
            });
        return passphraseDialogPromise;
    };

    sendType.prototype.sendSubmit = function(){
        var self = this;
        console.log("Send request submitted.");
        if(self.canSend()){
            if (self.isEncrypted()){
                console.log("Unlocking wallet for sending.");
                self.lockWallet().done(function(){
                    console.log('Wallet locked. Prompting for confirmation...');
                    self.sendConfirm(self.amount())
                        .done(function(){
                            self.unlockWallet()
                                .done(function(result){
                                    console.log("Wallet successfully unlocked, sending...");
                                    self.sendToAddress(result);
                                })
                                .fail(function(error){
                                    dialog.notification(error.message);
                                });
                        })
                        .fail(function(error){
                            dialog.notification(error.message);
                        });
                });
            } else {
                console.log("Sending...");
                self.sendToAddress(null);
            }
        }
        else{
            console.log("Can't send. Form in invalid state.");
        }
    };

    sendType.prototype.sendConfirm = function(amount){
        var self = this,
            sendConfirmDeferred = $.Deferred(),
            sendConfirmDialog = new ConfirmationDialog({
                title: 'Send Confirm',
                context: self,
                allowClose: false,
                message: 'You are about to send ' + amount + ' HCN, in addition to any fees the transaction may incur (e.g. ' + self.minerFee() + ' HCN). Do you wish to continue?',
                affirmativeButtonText: 'Yes',
                negativeButtonText: 'No',
                affirmativeHandler: function(){ sendConfirmDeferred.resolve(); },
                negativeHandler: function(){ sendConfirmDeferred.reject(); }
            });
        sendConfirmDialog.open();
        return sendConfirmDeferred.promise();
    };
    
    sendType.prototype.sendToAddress = function(auth) { 
        var self = this;
        var sendCommand = new Command('sendfrom',
                                      [self.wallet.account(), self.recipientAddress(), self.amount()],
                                      self.wallet.settings().env).execute()
            .done(function(txid){
                console.log("TxId: " + JSON.stringify(txid));
                if (typeof txid !== 'undefined') {
                    self.statusMessage(self.amount() + " HCN Successfully Sent!");
                } else {
                    self.statusMessage("HCN Was Not Sent. Try a smaller ammount.");
                }
                self.amount(0); // Resets Send button

                if (self.isEncrypted()){
                    self.lockWallet()
                        .done(function(){
                            var walletPassphrase = new WalletPassphrase({
                                walletPassphrase: auth,
                                forEncryption: false,
                                stakingOnly: true
                            });
                            console.log("Wallet successfully relocked. Opening for staking...");
                            walletPassphrase.openWallet(false)
                                .done(function() {
                                    auth = "";
                                    console.log("Wallet successfully re-opened for staking");
                                    self.wallet.refresh();
                                });
                        });
                }
            })
            .fail(function(error){
                self.statusMessage("Sorry, there was a problem sending.");
                console.log("Send error:");
                console.log(error);
                dialog.notification(error.message);
            });
        return sendCommand;
    };   

    return sendType; 
});
