define(['knockout',
        'common/dialog',
        'viewmodels/common/confirmation-dialog',
        'viewmodels/common/wallet-passphrase',
        'viewmodels/common/command',
        'patterns'], function(ko,dialog,ConfirmationDialog,WalletPassphrase,Command,patterns){
    var sendType = function(options){
        var self = this, sendOptions = options || {};
        this.wallet = sendOptions.parent;

        this.statusMessage = ko.observable("Enter Recipient Address and Amount");

        this.account = ko.observable("");

        this.recipientAddress = ko.observable("").extend( 
            { 
                pattern: { params: patterns.healthcoin, message: 'Not a valid address' },
                required: true
            });

        this.label = ko.observable("");

        this.amount = ko.observable(sendOptions.amount || 0.0).extend(
            { 
                number: true,
                required: true
            });

        this.minerFee = ko.observable(sendOptions.minerFee || 0.0001);
        this.canSend = ko.computed(function(){
            var amount = self.amount(),
                isNumber = !isNaN(amount),
                address = self.recipientAddress(),
                addressValid = self.recipientAddress.isValid(),
                //label = self.label,
                amountValid = self.amount.isValid(),
                available = self.wallet.walletStatus.available(),
                canSend;

            canSend = isNumber && addressValid && amountValid && available > 0 && address.length > 0 && amount > 0;
            return canSend;
        });

        this.isEncrypted = ko.computed(function(){
            return self.wallet.walletStatus.encryptionStatus();
        });
    };

    sendType.prototype.load = function(User, node_id){
        var self = this;
        if (self.account() === ""){
            var found = false;
			// Get the address/account for the node_id
			var wallet = User.wallet.filter(function(wal){
				if(!found && wal.node_id === node_id){
                    found = true;
                    self.account(wal.account);
					return wal;
				}
			});
			if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
        }
    };

    function lockWallet(){
        var sendCommand = new Command('walletlock').execute()
            .done(function(){
                console.log('Wallet relocked');
            })
            .fail(function(error){
                dialog.notification(error.message, "Failed to re-lock wallet");
            });
        return sendCommand;
    }

    sendType.prototype.unlockWallet= function(){
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
                lockWallet().done(function(){
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
                message: 'You are about to send ' + amount + ' HCN, in addition to any fees the transaction may incur (e.g. 0.0001 HCN). Do you wish to continue?',
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
        sendCommand = new Command('sendfrom', [self.account(), self.recipientAddress(), self.amount()]).execute()
            .done(function(txid){
                console.log("Success! TxId:" + txid);
                self.statusMessage("Success!");
                self.recipientAddress('');
                self.amount(0);

                if (self.isEncrypted()){
                    lockWallet()
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
   
    };   
    return sendType; 
});
