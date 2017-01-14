define(['knockout',
    'common/dialog',
    'viewmodels/common/confirmation-dialog',
    'viewmodels/common/wallet-passphrase',
    'viewmodels/common/command',
    '../common/biomarkers-pulldown',
    'moment',
    'patterns'], function(ko, dialog, ConfirmationDialog, WalletPassphrase, Command, BiomarkersPulldown, Moment, patterns){
    var biomarkersType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.statusMessage = ko.observable("");

        self.biomarkersPulldown = new BiomarkersPulldown(); // Source value arrays for pulldown menues

        self.profileComplete = ko.observable(false);
        self.role = ko.observable("");
        self.verified = ko.observable(false);
        self.terms = ko.observable(false);


        self.fileData = ko.observable({
            dataURL: ko.observable(),
            dataURLArray: ko.observableArray()
        });
        self.fileData().dataURL.subscribe(function (){
            self.dirtyFlag(true);
        });
        self.onClear = function(fileData){
            //if(confirm('Are you sure?')){
            if(fileData){
                fileData.clear();
            }                            
        };

        self.hcbmDate = ko.observable(Moment(Date.now()).utc().format("YYYY-MM-DD"));
        self.hcbmEHR_Source = ko.observable("");
        self.hcbmHA1c = ko.observable(0.00);
        self.hcbmTriglycerides = ko.observable(0);
        self.hcbmHDL = ko.observable(0);
        self.hcbmBPS = ko.observable(0);
        self.hcbmBPD = ko.observable(0);

        // These come from profile
        self.dob = ko.observable("");
        self.hcbmEmployer = ko.observable("");
        self.hcbmAge = ko.observable(0);
        self.hcbmWeight = ko.observable(0);
        self.hcbmWaist = ko.observable(0);
        self.hcbmGender = ko.observable("");
        self.hcbmEthnicity = ko.observable("");
        self.hcbmCountry = ko.observable("");

        self.hcbmDevice_Source = ko.observable("");
        self.hcbmDevice_Steps = ko.observable(0);
        self.hcbmComment = ko.observable("");

        self.dirtyFlag = ko.observable(false);
        self.isDirty = ko.computed(function() {
            return self.dirtyFlag();
        });

        // User changeables subscriptions
        self.hcbmEmployer.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmDate.subscribe(function (date){
            var bmd = Moment(date).utc();
            var dob = Moment(self.dob());
            var bmdYY = bmd.format("YYYY");
            var bmdMM = bmd.format("MM");
            var bmdDD = bmd.format("DD");
            var dobYY = dob.format("YYYY");
            var dobMM = dob.format("MM");
            var dobDD = dob.format("DD");
            var age = bmdYY - dobYY;
            if (bmdMM < dobMM){
                age--;
            } else {
                if (bmdMM === dobMM && bmdDD < dobDD){
                    age--; // Almost birthday time!
                }
            }
            self.hcbmAge(age);
            self.dirtyFlag(true);
        });
        self.hcbmWeight.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmWaist.subscribe(function (){self.dirtyFlag(true);});

        self.hcbmEHR_Source.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmHA1c.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmTriglycerides.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmHDL.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmBPS.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmBPD.subscribe(function (){self.dirtyFlag(true);});

        self.hcbmDevice_Source.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmDevice_Steps.subscribe(function (){self.dirtyFlag(true);});
        self.hcbmComment.subscribe(function (){self.dirtyFlag(true);});

        self.terms.subscribe(function (){self.dirtyFlag(true);});
        self.verified.subscribe(function (){self.dirtyFlag(true);});

        // For Admin view only.
        self.txcommentBiomarker = ko.observable("");

        // Recipient address for biomarker submission is the User's wallet address. (Send to self.)
        self.recipientAddress = ko.observable("").extend(
            {
                pattern: { params: patterns.coin, message: 'Not a valid address.' },
                required: true
            });

        // This is passed as a credit in the biomarker header for future granting.
        self.credit = ko.observable(0.00);

        self.amount = ko.observable(0.00).extend(
            {
                number: true,
                required: true
            });
        self.available = ko.observable(0.00);

        self.canSend = ko.computed(function(){
            var isAfter = Moment().utc().isAfter(Moment(self.hcbmDate()).utc());
            var hcbmValid = isAfter &&
                            self.hcbmEHR_Source() !== "" &&
                            self.hcbmHA1c() >= 2.00 && self.hcbmHA1c() <= 12.00 &&
                            self.hcbmTriglycerides() > 0 && self.hcbmTriglycerides() <= 400 &&
                            self.hcbmHDL() > 0 && self.hcbmHDL() <= 100 &&
                            self.hcbmBPS() >= 90 && self.hcbmBPS() <= 180 &&
                            self.hcbmBPD() >= 60 && self.hcbmBPD() <= 130 &&
                            self.hcbmEmployer() !== "" &&
                            self.hcbmAge() > 0 &&
                            self.hcbmWeight() >= 90 &&
                            self.hcbmWaist() >= 20;

            var address = self.recipientAddress(),
                addressValid = (address.length > 0 && self.recipientAddress.isValid()),
                amount = self.amount(),
                available = self.available(),
                amountValid = !isNaN(amount) && amount > 0.00 && amount < available && self.amount.isValid();

            self.statusMessage("");
            // Bottom to top messages
            if (self.role() === "Admin"){
                if (!self.verified()){
                  self.statusMessage("Warning! Biomarkers only submit to the blockchain if verified.");
                }
            } else {
                if (hcbmValid && !self.terms()){
                    hcbmValid = false;
                    self.statusMessage("Please agree to the Terms & Conditions to continue.");
                }
            }
            if (hcbmValid && self.hcbmComment().length > 500){
                hcbmValid = false;
                self.statusMessage("Please limit your comment to 500 characters.");
            }
            if (hcbmValid && (!isAfter || self.hcbmAge() < 1)){
                hcbmValid = false;
                self.statusMessage("Please enter a valid date for when biomarker was taken.");
            }
            if (available <= 0){
                hcbmValid = false;
                self.statusMessage("You do not have enough funds to submit a biomarker.");
            }
            return (hcbmValid && addressValid && amountValid);
        });

        // Helper functions for calculating health score
        function getHA1cScore(hcbmHA1c){
            var ha1cScore = 0;
            if (hcbmHA1c > 0.00){
                // Best score: 2.0 -> 4.7 = 100
                // Simulate a crude logarithm otherwise
                if (hcbmHA1c <= 4.7){
                    ha1cScore = 100;
                } else {
                    if (hcbmHA1c <= 6.4){
                        ha1cScore = Number(288/hcbmHA1c);
                    } else {
                            ha1cScore = Number(156/hcbmHA1c);
                    }
                }
            }
            //console.log("DEBUG: ha1cScore = " + ha1cScore);
            return ha1cScore;
        }
        function getTriglScore(hcbmTriglycerides){
            var triglScore = 0;
            if (hcbmTriglycerides > 0){
                // Best score: 20 -> 40 = 100
                // Simulate a crude logarithm otherwise
                if (hcbmTriglycerides <= 40){
                    triglScore = 100;
                } else {
                    if (hcbmTriglycerides <= 220){
                        triglScore = Number(4400/hcbmTriglycerides);
                    } else {
                        if (hcbmTriglycerides >= 320){
                            triglScore = 0;
                        } else {
                            triglScore = Number(2240/hcbmTriglycerides);
                        }
                    }
                }
            }
            //console.log("DEBUG: triglScore = " + triglScore);
            return triglScore;
        }
        function getHDLScore(hcbmHDL){
            var hdlScore = 0;
            if (hcbmHDL > 0){
                // Best score: 0 -> 28 = 100
                // Simulate a crude logarithm otherwise
                if (hcbmHDL <= 28){
                    hdlScore = 100;
                } else {
                    if (hcbmHDL <= 50){
                        hdlScore = Number(2000/hcbmHDL);
                    } else {
                        if (hcbmHDL >= 95){
                            hdlScore = 0;
                        } else {
                            hdlScore = Number(980/hcbmHDL);
                        }
                    }
                }
            }
            //console.log("DEBUG: hdlScore = " + hdlScore);
            return hdlScore;
        }
        function getBPScore(hcbmBPS, hcbmBPD){
            var bpScore = 0;
            if (hcbmBPS > 0 && hcbmBPD > 0){
                // Best score: 40.5 = (60+90)/2 * 0.6 * 0.9
                //             4050/40.5 = 100
                bpScore = Number(4050/((hcbmBPS+hcbmBPD)/2*(hcbmBPS/100)*(hcbmBPD/100)));
            }
            //console.log("DEBUG: bpScore = " + bpScore);
            return bpScore;
        }
        function getWaistScore(hcbmWaist, hcbmGender){
            var waistScore = 0;
            if (hcbmWaist > 0 && hcbmGender !== ""){
                if (hcbmGender === "Female"){
                    // Best score: 25 -> 27 = 100
                    // Simulate a crude logarithm otherwise
                    if (hcbmWaist <= 27){
                        waistScore = 100;
                    } else {
                        if (hcbmWaist <= 45){
                            waistScore = Number(1440/hcbmWaist);
                        } else {
                            waistScore = 0;
                        }
                    }
                } else {
                    // Best score: 30 -> 32 = 100
                    // Simulate a crude logarithm otherwise
                    if (hcbmWaist <= 32){
                        waistScore = 100;
                    } else {
                        if (hcbmWaist <= 50){
                            waistScore = Number(1440/hcbmWaist);
                        } else {
                            waistScore = 0;
                        }
                    }
                }
            }
            //console.log("DEBUG: waistScore = " + waistScore);
            return waistScore;
        }
        self.hcbmScore = ko.computed(function(){
            // Calculate the Healthscore based on Nick's ratios.
            // score = (x * HA1c) + (x * Triglycerides) + (x * HDL) + (x * (BPS + BPD)/2 * (BPS/100) * (BPD/100)) + (x * Waist/Gender)
            var xHA1c  = Number(0.50 * getHA1cScore(self.hcbmHA1c()));
            var xTrigl = Number(0.05 * getTriglScore(self.hcbmTriglycerides()));
            var xHDL   = Number(0.20 * getHDLScore(self.hcbmHDL()));
            var xBP    = Number(0.15 * getBPScore(self.hcbmBPS(), self.hcbmBPD()));
            var xWaist = Number(0.05 * getWaistScore(self.hcbmWaist(), self.hcbmGender()));

            return self.wallet.formatNumber(Number(xHA1c + xTrigl + xHDL + xBP + xWaist), 2, '.', ',');
        });

        self.isEncrypted = ko.computed(function(){
            return (self.wallet.walletStatus.isEncrypted() === 'Yes');
        });
    };

    biomarkersType.prototype.refresh = function(timerRefresh){
        var self = this;
        self.available(self.wallet.walletStatus.available());
        self.amount(self.wallet.settings().minTxFee);
        self.credit(self.wallet.settings().minTxFee * 2);

        if (!self.profileComplete() && !self.wallet.profileComplete()){
            self.statusMessage("Please complete your profile before continuing.");
        } else {
            if (!self.profileComplete()){
                self.profileComplete(true);
                self.statusMessage("");
            }
            if (timerRefresh && !self.isDirty()){
                self.role(self.wallet.User().profile.role);
                self.dob(Moment(self.wallet.User().profile.dob).utc().format("YYYY-MM-DD"));
                self.hcbmEmployer(self.wallet.User().profile.employer);
                self.hcbmAge(self.wallet.User().profile.age);
                self.hcbmGender(self.wallet.User().profile.gender);
                self.hcbmEthnicity(self.wallet.User().profile.ethnicity);
                self.hcbmCountry(self.wallet.User().profile.country);
                self.recipientAddress(self.wallet.address()); // Send to self
                self.dirtyFlag(false);
            }
        }
        console.log("DEBUG: role = " + self.role());
    };

    biomarkersType.prototype.Reset = function(){
        var self = this;
        self.hcbmDate(Moment(Date.now()).utc().format("YYYY-MM-DD"));
        self.hcbmEHR_Source("");
        self.hcbmHA1c(0.00);
        self.hcbmTriglycerides(0);
        self.hcbmHDL(0);
        self.hcbmBPS(0);
        self.hcbmBPD(0);
        self.hcbmEmployer(self.wallet.User().profile.employer);
        self.hcbmAge(self.wallet.User().profile.age);
        self.hcbmWeight(0);
        self.hcbmWaist(0);
        self.hcbmDevice_Source("");
        self.hcbmDevice_Steps(0);
        self.hcbmComment("");
        self.txcommentBiomarker("");

        self.fileData().clear();
        self.terms(false);
        self.verified(false);
        self.dirtyFlag(false);
        self.statusMessage("");
    };

    biomarkersType.prototype.Submit = function(){
        var self = this;
        // Build and validate the biomarker.
        self.txcommentBiomarker(self.buildBiomarker());
        //console.log("Biomarker: " + self.txcommentBiomarker());

        this.sendSubmit();
    };

    biomarkersType.prototype.lockWallet= function(){
        var self = this;
        var walletlockCommand = new Command('walletlock', [],
                                            self.wallet.settings().chRoot,
                                            self.wallet.settings().env).execute()
            .done(function(){
                console.log('Wallet relocked');
            })
            .fail(function(error){
                dialog.notification(error.message, "Failed to re-lock wallet");
            });
        return walletlockCommand;
    };

    biomarkersType.prototype.unlockWallet= function(){
        var self = this;
        var walletPassphrase = new WalletPassphrase({canSpecifyStaking:true,
                                                    stakingOnly:false,
                                                    chRoot: self.wallet.settings().chRoot,
                                                    env: self.wallet.settings().env
                                                    }
            ), passphraseDialogPromise = $.Deferred();

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
                                    self.sendBiomarker(result);
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
                self.sendBiomarker(null);
            }
        } else {
            console.log("Can't send. Form in invalid state.");
        }
    };

    biomarkersType.prototype.sendConfirm = function(){
        var self = this,
            sendConfirmDeferred = $.Deferred(),
            sendConfirmDialog = new ConfirmationDialog({
                title: 'Send Confirm',
                context: self,
                allowClose: false,
                message: 'You are about to send encrypted, anonymous bio-marker data to the blockchain. Do you wish to continue?',
                affirmativeButtonText: 'Yes',
                negativeButtonText: 'No',
                affirmativeHandler: function(){ sendConfirmDeferred.resolve(); },
                negativeHandler: function(){ sendConfirmDeferred.reject(); }
            });
        sendConfirmDialog.open();
        return sendConfirmDeferred.promise();
    };

    biomarkersType.prototype.sendBiomarker = function(auth){
        var self = this;
        // Encode to base64 before sending.
        var hcbm = btoa(JSON.stringify(self.txcommentBiomarker()));
        // Except for the meta-data, this is already an array of base64 strings
        var dataURLArray = btoa(JSON.stringify(self.fileData().dataURLArray()));
        var sendCommand = new Command('sendbiomarker', [{
                                      fromaccount: self.wallet.account(),
                                      toaddress: self.recipientAddress(),
                                      amount: self.amount(),
                                      minconf: 1,
                                      comment: "HCBM",
                                      commentto: self.recipientAddress(),
                                      txcomment: hcbm,
                                      verified: self.verified(),
                                      dataurlarray: dataURLArray
                                      }],
                                      self.wallet.settings().chRoot,
                                      self.wallet.settings().env).post()
            .done(function(txid){
                if (self.wallet.settings().env !== 'production'){
                    console.log("TxId: " + txid);
                }
                // Reset Send button
                self.Reset();
                self.statusMessage("Success!");
                self.wallet.User().profile.credit = self.wallet.User().profile.credit + self.credit();
                var saveUserProfileCommand = new Command('saveuserprofile',
                                                        [encodeURIComponent(btoa(JSON.stringify(self.wallet.User().profile)))],
                                                        self.wallet.settings().chRoot,
                                                        self.wallet.settings().env).execute()
                    .done(function(){
                        console.log("User credited!");
                    });

                if (self.isEncrypted()){
                    self.lockWallet()
                        .done(function(){
                            var walletPassphrase = new WalletPassphrase({
                                walletPassphrase: auth,
                                forEncryption: false,
                                stakingOnly: true,
                                chRoot: self.wallet.settings().chRoot,
                                env: self.wallet.settings().env
                            });
                            console.log("Wallet successfully relocked. Opening for staking...");
                            walletPassphrase.openWallet(false)
                                .done(function() {
                                    auth = "";
                                    console.log("Wallet successfully re-opened for staking");
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
        "Date": Moment(self.hcbmDate()).utc(), // Date of biomarker
		"EHR_Source": self.hcbmEHR_Source(),
        "A1C": self.hcbmHA1c(),
        "Triglycerides": self.hcbmTriglycerides(),
        "HDL": self.hcbmHDL(),
        "BPS": self.hcbmBPS(),
        "BPD": self.hcbmBPD(),
		"Employer": self.hcbmEmployer(),
        "Age": self.hcbmAge(),
        "Weight": self.hcbmWeight(),
        "Waist": self.hcbmWaist(),
		"Gender": self.hcbmGender(),
		"Ethnicity": self.hcbmEthnicity(),
		"Country": self.hcbmCountry(),
        "Device_Source": self.hcbmDevice_Source(),
        "Device_Steps": self.hcbmDevice_Steps(),
        "Comment": self.hcbmComment(),
		"Score": self.hcbmScore()
        };

        return hcbm;
    };

    return biomarkersType;
});
