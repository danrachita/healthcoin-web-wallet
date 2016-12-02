define(['knockout',
    'common/dialog',
    'viewmodels/receive/receive-address',
    'viewmodels/common/command',
    'viewmodels/receive/new-address-dialog'], function(ko,dialog,ReceiveAddress,Command,NewAddressDialog){
    var receiveType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.addresses = ko.observableArray([]);
        self.isLoadingReceiveAddresses = ko.observable(false);
        self.isLoading = ko.computed(function(){
            var trans = self.isLoadingReceiveAddresses();
            return trans;
        });
        self.newAddressDialog = new NewAddressDialog({parent: self});
        self.showNewAddressDialog = ko.observable(false);

        self.statusMessage = ko.observable("");
    };

    receiveType.prototype.refresh = function(){
        var self = this;
        // Add short delay to healthcoin-wallet's initial short timeout
        setTimeout(function(){
            if (self.wallet.account() !== ""){
                self.getReceiveAddresses();
            }
        },2000);
    };

    receiveType.prototype.newAddress = function(){
        dialog.openDialog(this.newAddressDialog, 'modals/new-address');
    };

    receiveType.prototype.newAddressConfirm = function(account, address){
        var self = this, getNewAddressCommand = new Command('getnewaddress', [self.wallet.account()], self.wallet.settings().env);
        getNewAddressCommand.execute()
            .done(function(address){
                self.addresses.push(new ReceiveAddress({addressObj:{address: address, account: self.wallet.account()}}));
            })
            .fail(function(){
            })
            .always(function(){
            });

        dialog.closeDialog();
    };

    receiveType.prototype.newAddressCancel = function(){
        dialog.closeDialog();        
    };

    receiveType.prototype.getReceiveAddresses = function(){
        var self = this, listReceivedByAddressesCommand = new Command('listreceivedbyaddress', ['1','true'], self.wallet.settings().env);
        self.isLoadingReceiveAddresses(true);
        var receivePromise = listReceivedByAddressesCommand.execute()
            .done(function(data){
                for (var k in data){
                    //console.log("data[k]:" + JSON.stringify(data[k]));
                    if (data[k].account !== self.wallet.account()){
                        delete data[k];
                    }
                }
                self.addresses(ko.utils.arrayMap(data,function(addressObj){
                        return new ReceiveAddress({addressObj: addressObj});
                }));
                self.isLoadingReceiveAddresses(false); 
            });
        return receivePromise;
    };

    return receiveType; 
});
