define(['knockout',
    'common/dialog',
    'viewmodels/common/confirmation-dialog',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command',
    'lib/dateformat',
    'patterns'], function(ko, dialog, ConfirmationDialog, WalletPassphrase, Command, Dateformat, patterns){
    var biomarkersType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.hcbmDate = ko.observable(Dateformat(Date.now(), "yyyy-mm-dd"));
        self.hcbmEHR_Source = ko.observable("");
        self.hcbmEHR_SourceValues = ko.observableArray(["",
                                    "Columbia South Valley Hospital, Gilroy",
                                    "Community Hospital of Los Gatos, Los Gatos",
                                    "El Camino Hospital, Mountain View",
                                    "Good Samaritan Hospital, San Jose",
                                    "Kaiser Permanente Medical Center Gilroy, Gilroy, California",
                                    "Kaiser Permanente Santa Clara Medical Center, Santa Clara, California",
                                    "Kaiser Permanente Santa Teresa Medical Center, San Jose, California",
                                    "Lucile Salter Packard Children's Hospital at Stanford, Palo Alto, California",
                                    "O'Connor Hospital, San Jose, California",
                                    "Regional Medical Center of San Jose, San Jose, California",
                                    "Saint Louise Regional Hospital, Gilroy, California",
                                    "San Jose Medical Center, San Jose, California",
                                    "Santa Clara Valley Medical Center, San Jose, California",
                                    "Stanford University Medical Center, Stanford",
                                    "VA Palo Alto Health Care System, Palo Alto"
                                    ]);
        self.hcbmEHR_Type = ko.observable("");
        self.hcbmEHR_TypeValues =   ko.observableArray(["",
                                    "Athena Health",
                                    "Cerner",
                                    "CPSI",
                                    "Drchrono",
                                    "EClinicalWorks",
                                    "Epic",
                                    "GE Healthcare",
                                    "Greenway Health",
                                    "McKesson",
                                    "Meditech",
                                    "Nextgen"
                                    ]);
        self.hcbmA1c = ko.observable(0.00);
        self.hcbmTriglycerides = ko.observable(0);
        self.hcbmHDL = ko.observable(0);
        self.hcbmBPS = ko.observable(0);
        self.hcbmBPD = ko.observable(0);

        // These come from profile
        self.hcbmAge = ko.observable(0);
        self.hcbmWeight = ko.observable(0);
        self.hcbmWaist = ko.observable(0);
        self.hcbmGender = ko.observable("");
        self.hcbmEthnicity = ko.observable("");
        self.hcbmCountry = ko.observable("");

        self.hcbmDevice_Source = ko.observable("");
        self.hcbmDevice_SourceValues =   ko.observableArray(["",
                                    "Adidas",
                                    "Apple",
                                    "Biomedtrics",
                                    "BodyTrace",
                                    "CareTRx",
                                    "CoheroHealth",
                                    "DailyMile",
                                    "Edamam",
                                    "Emfit",
                                    "EpsonPulsense",
                                    "Fatsecret",
                                    "Fitbit",
                                    "Fitbug",
                                    "FitLinxx",
                                    "Garmin Connect",
                                    "Higi",
                                    "iHealth",
                                    "inrfood",
                                    "Jawbone Up",
                                    "Kiqplan",
                                    "Life Fitness",
                                    "LifeTrak",
                                    "Lumo",
                                    "ManageBGL",
                                    "MapMyFitness",
                                    "Microsoft",
                                    "Misfit",
                                    "Moov",
                                    "Moveable",
                                    "Moves",
                                    "MyFitnessPal",
                                    "Omron Wellness",
                                    "PearSports",
                                    "Personalabs",
                                    "Polar",
                                    "Precor",
                                    "Qardio",
                                    "RunKeeper",
                                    "RxCheck",
                                    "Sleep_Image",
                                    "Sony",
                                    "Strava",
                                    "Striiv",
                                    "Suunto",
                                    "Telcare",
                                    "TomTom MySports",
                                    "Under Armour",
                                    "Visiomed",
                                    "VitaDock",
                                    "Withings",
                                    "Yoo"
                                    ]);
        self.hcbmDevice_Steps = ko.observable(0);
        self.hcbmScore = ko.observable(0);
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
                          self.hcbmA1c() >= 2.00 && self.hcbmA1c() <= 12.00 &&
                          self.hcbmTriglycerides() >= 0 && self.hcbmTriglycerides() <= 400 &&
                          self.hcbmHDL() >= 0 && self.hcbmHDL() <= 100 &&
                          self.hcbmBPS() >= 90 && self.hcbmBPS() <= 180 &&
                          self.hcbmBPD() >= 60 && self.hcbmBPD() <= 130;

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

        self.tallyScore = ko.computed(function(){
            // TODO: Use Nick's algo.
            var bpScore = 0;
            if (self.hcbmBPS() && self.hcbmBPD()){
                bpScore = Number(self.hcbmBPS()) / Number(self.hcbmBPD()) - 1;
            }
            var score = Number(self.hcbmA1c()) + Number(self.hcbmTriglycerides()) + Number(self.hcbmHDL()) + bpScore;
            return score;
        });

        self.isEncrypted = ko.computed(function(){
            return (self.wallet.walletStatus.isEncrypted() === 'Yes');
        });

        self.statusMessage = ko.observable("");
    };

    biomarkersType.prototype.refresh = function(){
        var self = this;
        // Add short delay to healthcoin-wallet's initial short timeout
        setTimeout(function(){
            if (!self.isDirty() && self.wallet.User().profile){
                self.hcbmAge(self.wallet.User().profile.age);
                self.hcbmWeight(self.wallet.User().profile.weight);
                self.hcbmWaist(self.wallet.User().profile.waist);
                self.hcbmGender(self.wallet.User().profile.gender);
                self.hcbmEthnicity(self.wallet.User().profile.ethnicity);
                self.hcbmCountry(self.wallet.User().profile.country);
                // Get the address of the user
                self.recipientAddress(self.wallet.address()); // Send to self
                if (!self.wallet.profileComplete()){
                    self.statusMessage("Please complete your profile before continuing.");
                } else {
                    var creditFmt = self.wallet.formatNumber(self.wallet.User().profile.credit, 4, '.', ',');
                    self.statusMessage("You've earned " + creditFmt + " " + self.wallet.settings().coinsymbol + " credit so far!");
                }
                self.dirtyFlag(false);
            }
        },2000);
    };

    biomarkersType.prototype.Reset = function(){
        var self = this;
        self.hcbmDate(Dateformat(Date.now(), "yyyy-mm-dd"));
        self.hcbmEHR_Source("");
        self.hcbmEHR_Type("");
        self.hcbmA1c(0.00);
        self.hcbmTriglycerides(0);
        self.hcbmHDL(0);
        self.hcbmBPS(0);
        self.hcbmBPD(0);
        self.hcbmDevice_Source("");
        self.hcbmDevice_Steps(0);

        self.dirtyFlag(false);
        this.refresh();
    };

    biomarkersType.prototype.Submit = function(){
        var self = this;
        // Build and validate the biomarker.
        self.txcommentBiomarker(self.buildBiomarker());
        if (self.wallet.settings().env !== 'production'){
            console.log("Biomarker: " + self.txcommentBiomarker());
        }

        this.sendSubmit();
    };

    function lockWallet(){
        var walletlockCommand = new Command('walletlock', [], self.wallet.settings().env).execute()
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

        walletPassphrase.userPrompt(false, 'Wallet Unlock', 'Unlock the wallet for sending','OK')
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
        //if(self.canSend()){
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
        //} else {
        //    console.log("Can't send. Form in invalid state.");
        //}
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
        var sendCommand = new Command('sendfrom',
                                      [self.wallet.account(), self.recipientAddress(), self.amount(), 1, "HCBM", self.recipientAddress(), hcbm],
                                      self.wallet.settings().env).execute()
            .done(function(txid){
                if (self.wallet.settings().env !== 'production'){
                    console.log("TxId: " + txid);
                }
                self.statusMessage("Success! You've earned " + self.amount() + " credits.");
                self.Reset();
                self.wallet.User().profile.credit = self.wallet.User().profile.credit + self.amount();
                var saveUserProfileCommand = new Command('saveuserprofile',
                                                        [encodeURIComponent(btoa(JSON.stringify(self.wallet.User().profile)))],
                                                        self.wallet.settings().env).execute()
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
                return saveUserProfileCommand;
            })
            .fail(function(error){
                self.statusMessage("Sorry, there was a problem sending.");
                console.log("Send error:");
                console.log(error);
                dialog.notification(error.message);
            });
        return sendCommand;
    };

    biomarkersType.prototype.buildBiomarker = function(){
        var self = this;
        var hcbm = {
        "Date": self.hcbmDate(), // Date of activity
		"EHR_Source": self.hcbmEHR_Source(),
		"EHR_Type": self.hcbmEHR_Type(),
        "A1C": self.hcbmA1c(),
        "Triglycerides": self.hcbmTriglycerides(),
        "HDL": self.hcbmHDL(),
        "BPS": self.hcbmBPS(),
        "BPD": self.hcbmBPD(),
        "Age": self.hcbmAge(),
        "Weight": self.hcbmWeight(),
        "Waist": self.hcbmWaist(),
		"Gender": self.hcbmGender(),
		"Ethnicity": self.hcbmEthnicity(),
		"Country": self.hcbmCountry(),
        "Device_Source": self.hcbmDevice_Source(),
        "Device_Steps": self.hcbmDevice_Steps(),
		"Score": self.hcbmScore(),
        "Other": self.hcbmOther()
        };

        return JSON.stringify(hcbm);
    };

    return biomarkersType;
});
