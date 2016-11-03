define(['knockout',
    'common/dialog',
    'viewmodels/common/confirmation-dialog',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command',
    'lib/dateformat',
    'patterns'], function(ko, dialog, ConfirmationDialog, WalletPassphrase, Command, Dateformat, patterns){
    var biomarkersType = function(options){
        var self = this, opts = options || {};
        self.wallet = opts.parent;

        self.User = ko.observable({});
        self.node_id = ko.observable("");
        self.account = ko.observable("");

        self.statusMessage = ko.observable("");

        self.hcbmDate = ko.observable("");
        self.hcbmEHR_Source = ko.observable("");
        self.hcbmEHR_Type = ko.observable("");
        self.hcbmA1c = ko.observable(0);
        self.hcbmTriglycerides = ko.observable(0);
        self.hcbmHDL = ko.observable(0);
        self.hcbmBPS = ko.observable(0);
        self.hcbmBPD = ko.observable(0);
        self.hcbmAge = ko.observable(0);
        self.hcbmWeight = ko.observable(0);
        self.hcbmWaist = ko.observable(0);
        self.hcbmGender = ko.observable(0);
        self.hcbmEthnicity = ko.observable(0);
        self.hcbmCountry = ko.observable(0);
        self.hcbmDevice_Source = ko.observable("None");
        self.hcbmDevice_Steps = ko.observable(0);
        self.hcbmOther = ko.observable("n/a");

        self.dirtyFlag = ko.observable(false);
        self.isDirty = ko.computed(function() {
            return self.dirtyFlag();
        });

        // User changeables subscriptions
        self.hcbmDate.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmEHR_Source.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmEHR_Type.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmA1c.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmTriglycerides.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmHDL.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmBPS.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmBPD.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmAge.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmWeight.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmWaist.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmGender.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmEthnicity.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmCountry.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmDevice_Source.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmDevice_Steps.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmOther.subscribe(function (){self.dirtyFlag(true);});

        // For Admin view only.
        self.txcommentBiomarker = ko.observable("hcbm").extend(
            {
                pattern: { params: patterns.biomarker, message: 'Not a valid bio-marker' },
                required: true
            });
        // Recipient address for biomarker submission is the User's HCN address. (Send to self.)
        self.recipientAddress = ko.observable("").extend(
            {
                pattern: { params: patterns.healthcoin, message: 'Not a valid address' },
                required: true
            });
        // This is passed as a credit in the biomarker header for future granting.
        self.amount = ko.observable(0.0001).extend(
            {
                number: true,
                required: true
            });

        self.canSend = ko.computed(function(){
            var canSend = self.hcbmDate() !== "" &&
                          self.hcbmEHR_Source() !== "" &&
                          self.hcbmEHR_Type() !== "" &&
                          self.hcbmA1c() > 0 &&
                          self.hcbmTriglycerides() > 0 &&
                          self.hcbmHDL() > 0 &&
                          self.hcbmBPS() > 0 &&
                          self.hcbmBPD() > 0;

            var amount = self.amount(),
                isNumber = !isNaN(amount),
                biomarker = self.txcommentBiomarker(),
                biomarkerValid = self.txcommentBiomarker.isValid(),
                address = self.recipientAddress(),
                addressValid = self.recipientAddress.isValid(),
                amountValid = self.amount.isValid(),
                available = self.wallet.walletStatus.available();

            canSend = canSend && isNumber && biomarkerValid && biomarker.length > 0 && addressValid && amountValid && available > 0 && address.length > 0 && amount > 0;
            return canSend;
        });

        self.isEncrypted = ko.computed(function(){
            return self.wallet.walletStatus.encryptionStatus();
        });
    };

    biomarkersType.prototype.load = function(User, node_id){
        var self = this;
        if (User && node_id){
            self.User(User);
            self.node_id(node_id);
            var date = Dateformat(Date.now(), "yyyymmdd");
            console.log("DEBUG: date: " + date);
            self.hcbmDate(date);
            self.hcbmEHR_Source("");
            self.hcbmEHR_Type("");
            self.hcbmA1c("000");
            self.hcbmTriglycerides("000");
            self.hcbmHDL("000");
            self.hcbmBPS("000");
            self.hcbmBPD("000");
            self.hcbmAge(User.profile.age);
            self.hcbmWeight(User.profile.weight);
            self.hcbmWaist(User.profile.waist);
            self.hcbmGender(User.profile.gender);
            self.hcbmEthnicity(User.profile.ethnicity);
            self.hcbmCountry(User.profile.country);
            self.hcbmDevice_Source("None");
            self.hcbmDevice_Steps("000");
            self.hcbmOther("n/a");
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
                console.log("Error: wallet not found for self node:" + JSON.stringify(wallet) + " node_id:" + node_id);
        }
        self.dirtyFlag(false);
    };

    biomarkersType.prototype.Reset = function(){
        var self = this;
        this.load(self.User(), self.node_id());
    };

    biomarkersType.prototype.Submit = function(){
        var self = this;
        // Build and validate the biomarker.
        self.txcommentBiomarker(self.buildBiomarker());

        this.sendSubmit();
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
        // Add biomarker to schema server-side then encode base64 before sending.
        var hcbm = encodeURIComponent(btoa(self.txcommentBiomarker()));
        sendCommand = new Command('sendfrom',
            [self.account(), self.recipientAddress(), self.amount(), 1, "HCBM", self.recipientAddress(), hcbm]).execute()
            .done(function(txid){
                console.log("Success! TxId:" + txid);
                self.statusMessage("Success! You've earned " + self.amount() + " credits.");
                self.Reset();
                self.User().profile.credit = self.User().profile.credit + self.amount();
                var saveUserProfileCommand = new Command('saveuserprofile',
                    [encodeURIComponent(btoa(JSON.stringify(self.User().profile)))]).execute()
                    .done(function(){
                        console.log("User Profile credited!");
                    });

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
        var self = this;
        var hcbm = {
        "Date": self.hcbmDate(), // Date of activity
		"EHR_Source": self.hcbmEHR_Source(),
		"EHR_Type": self.hcbmEHR_Type(),
        "A1c": self.hcbmA1c(),
        "Triglycerides": self.hcbmTriglycerides(),
        "HDL": self.hcbmHDL(),
        "BPS": self.hcbmBPS(),
        "BPD": self.hcbmBPD(),
        "Age": self.hcbmAge(),
        "Weight": self.hcbmWeight(),
        "Waist": self.hcbmWaist(),
		"Gender" : self.hcbmGender(),
		"Ethnicity" : self.hcbmEthnicity(),
		"Country" : self.hcbmCountry(),
        "Device_Source": self.hcbmDevice_Source(),
        "Device_Steps": self.hcbmDevice_Steps(),
        "Other": self.hcbmOther()
        };

        return JSON.stringify(hcbm);
    };

    return biomarkersType;
});
