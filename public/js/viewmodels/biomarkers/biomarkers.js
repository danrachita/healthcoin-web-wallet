define(['knockout',
    'common/dialog',
    'viewmodels/common/confirmation-dialog',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command',
    'patterns'], function(ko,dialog,ConfirmationDialog,WalletPassphrase,Command,patterns){
    var biomarkersType = function(options){
        var self = this, opts = options || {};
        this.wallet = opts.parent;

        this.statusMessage = ko.observable("Enter Your Biomarker Data");

        this.account = ko.observable("");

        this.txcommentBiomarker = ko.observable("").extend(
            {
                pattern: { params: patterns.biomarker, message: 'Not a valid bio-marker' },
                required: true
            });

        // Recipient address for biomarker submission it the User's account address. (Send to self.)
        this.recipientAddress = ko.observable("").extend(
            {
                pattern: { params: patterns.healthcoin, message: 'Not a valid address' },
                required: true
            });

        this.amount = ko.observable(0.0001).extend(
            {
                number: true,
                required: true
            });

        this.biomarkerCredit = ko.observable(0.0001);

        this.minerFee = ko.observable(0.0001);

        this.canSend = ko.computed(function(){
            var amount = self.amount(),
                isNumber = !isNaN(amount),
                biomarker = self.txcommentBiomarker(),
                biomarkerValid = self.txcommentBiomarker.isValid(),
                address = self.recipientAddress(),
                addressValid = self.recipientAddress.isValid(),
                amountValid = self.amount.isValid(),
                available = self.wallet.walletStatus.available(),
                canSend;

            canSend = isNumber && biomarkerValid && biomarker.length > 0 && addressValid && amountValid && available > 0 && address.length > 0 && amount > 0;
            return canSend;
        });

        this.isEncrypted = ko.computed(function(){
            return self.wallet.walletStatus.encryptionStatus();
        });
    };

    biomarkersType.prototype.load = function(User, node_id){
        var self = this;
        if (self.account() === ""){
            var found = false;
			// Get the address/account for the node_id
			var wallet = User.wallet.filter(function(wal){
				if(!found && wal.node_id === node_id){
                    found = true;
                    self.account(wal.account);
                    self.recipientAddress(wal.address); // Send to self
					return wal;
				}
			});
			if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
        }
    };

    function isJSON(json){
        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true;
    }

    function lockWallet(){
        var walletlockCommand = new Command('walletlock').execute()
            .done(function(){
                console.log('Wallet relocked');
            })
            .fail(function(error){
                dialog.notification(error.message, "Failed to re-lock wallet");
            });
        return walletlockCommand;
    }

    biomarkersType.prototype.unlockWallet= function(){
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

    biomarkersType.prototype.sendSubmit = function(){
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

    biomarkersType.prototype.sendConfirm = function(amount){
        var self = this, 
            sendConfirmDeferred = $.Deferred(),
            sendConfirmDialog = new ConfirmationDialog({
                title: 'Send Confirm',
                context: self,
                allowClose: false,
                message: 'You are about to send encrypted bio-marker data to the Healthcoin (HCN) network. Do you wish to continue?',
                affirmativeButtonText: 'Yes',
                negativeButtonText: 'No',
                affirmativeHandler: function(){ sendConfirmDeferred.resolve(); },
                negativeHandler: function(){ sendConfirmDeferred.reject(); }
            });
        sendConfirmDialog.open();
        return sendConfirmDeferred.promise();
    };

    biomarkersType.prototype.encodeBase64 = function(str){
        if (str) {
            return window.btoa(str);
        }
        return "";
    };

    biomarkersType.prototype.sendToAddress = function(auth){
        var self = this;
        if (!isJSON(self.txcommentBiomarker())){
            dialog.notification("Error: JSON format error.");
            return;
        }
        // hash the text in base64 and append to 'hcbm:'
        var hcbm = encodeURIComponent("hcbm:" + this.encodeBase64(self.txcommentBiomarker()));
        sendCommand = new Command('sendfrom',
            [self.account(), self.recipientAddress(), self.amount(), 1, "Biomarker", self.recipientAddress(), hcbm]).execute()
            .done(function(txid){
                console.log("Success! TxId:" + txid);
                self.statusMessage("Success! You've earned " + self.biomarkerCredit() + " credits.");
                self.txcommentBiomarker('');
                //self.recipientAddress('');
                //self.amount(0);

                /* TODO: Need to dubmit updates to User profile.
                User.findOne({'_id': self.User()._id}, function(err, user){
                    if(err)
                        return done(err);
                    if(user){
                        var credit = user.profile.credit + self.biomarkerCredit();
                        user.profile.credit = credit;
                        user.save(function(err){
                            if(err)
                                throw err;
                        });
                    } else {
                        console.log("Error: User not found!");
                    }
                });
                */

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
    return biomarkersType;
});
