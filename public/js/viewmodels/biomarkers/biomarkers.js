define(['knockout',
    'common/dialog',
    'viewmodels/common/confirmation-dialog',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command',
    'patterns'], function(ko,dialog,ConfirmationDialog,WalletPassphrase,Command,patterns){
    var biomarkersType = function(options){
        var self = this, opts = options || {};
        this.wallet = opts.parent;

        this.role = ko.observable("");

        this.account = ko.observable("");
        this.statusMessage = ko.observable("");

        this.hcbmDate = ko.observable("");
        this.hcbmEHR_Source = ko.observable("");
        this.hcbmEHR_Type = ko.observable("");
        this.hcbmA1c = ko.observable(0);
        this.hcbmTriglycerides = ko.observable(0);
        this.hcbmHDL = ko.observable(0);
        this.hcbmBPS = ko.observable(0);
        this.hcbmBPD = ko.observable(0);
        this.hcbmWaist = ko.observable(0);
        this.hcbmWeight = ko.observable(0);
        this.hcbmDevice_Source = ko.observable("");
        this.hcbmDevice_Steps = ko.observable(0);
        this.hcbmOther = ko.observable("");

        // For Admin view only.
        this.txcommentBiomarker = ko.observable("").extend(
            {
                pattern: { params: patterns.biomarker, message: 'Not a valid bio-marker' },
                required: true
            });
        // Recipient address for biomarker submission is the User's HCN address. (Send to self.)
        this.recipientAddress = ko.observable("").extend(
            {
                pattern: { params: patterns.healthcoin, message: 'Not a valid address' },
                required: true
            });
        // This is passed as a credit in the biomarker header for future granting.
        this.amount = ko.observable(0.0001).extend(
            {
                number: true,
                required: true
            });

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
            self.role(User.profile.role);
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

    biomarkersType.prototype.sendToAddress = function(auth){
        var self = this;

        // Build and validate the biomarker.
        self.txcommentBiomarker(JSON.stringify(self.buildBiomarker()));

        // Add biomarker to schema server-side then encode base64 before sending.
        var hcbm = encodeURIComponent(self.txcommentBiomarker());
        sendCommand = new Command('sendfrom',
            [self.account(), self.recipientAddress(), self.amount(), 1, "HCBM", self.recipientAddress(), hcbm]).execute()
            .done(function(txid){
                console.log("Success! TxId:" + txid);
                self.statusMessage("Success! You've earned " + self.amount() + " credits.");

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

    biomarkersType.prototype.buildBiomarker = function(){
        var hcbm = {
        "Date": this.hcbmDate(), // Date of activity
		"EHR_Source": this.hcbmEHR_Source(),
		"EHR_Type": this.hcbmEHR_Type(),
        "A1c": this.hcbmA1c(),
        "Triglycerides": this.hcbmTriglycerides(),
        "HDL": this.hcbmHDL(),
        "BPS": this.hcbmBPS(),
        "BPD": this.hcbmBPD(),
        "Waist": this.hcbmWaist(),
        "Weight": this.hcbmWeight(),
        "Device_Source": this.hcbmDevice_Source(),
        "Device_Steps": this.hcbmDevice_Steps(),
        "Other": this.hcbmOther()
        };

        return hcbm;
    };

    return biomarkersType;
});
