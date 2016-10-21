define(['knockout',
    'common/dialog',
    'viewmodels/receive/receive-address',
    'viewmodels/common/command',
    'viewmodels/receive/new-address-dialog'], function(ko,dialog,ReceiveAddress,Command,NewAddressDialog){
    var receiveType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.account = ko.observable("");
        self.addresses = ko.observableArray([]);
        self.isLoadingReceiveAddresses = ko.observable(false);
        self.isLoading = ko.computed(function(){
            var trans = self.isLoadingReceiveAddresses();
            return trans;
        });
        self.newAddressDialog = new NewAddressDialog({parent: self});
        self.showNewAddressDialog = ko.observable(false);
    };

    receiveType.prototype.load = function(User){
        if (this.account() === "")
            this.account(User.wallet[0].hcn_account); // First time load

        this.getReceiveAddresses();
    };

    receiveType.prototype.newAddress = function(){
        dialog.openDialog(this.newAddressDialog, 'modals/new-address');
    };

    receiveType.prototype.newAddressConfirm = function(address, account){
        var self = this, getNewAddressCommand = new Command('getnewaddress',[self.account()]); // Use self.account() to be safe.
        getNewAddressCommand.execute()
            .done(function(address){
                self.addresses.push(new ReceiveAddress({addressObj:{address: address, account: self.account()}}));
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
        var self = this, getReceivedByAddressesCommand = new Command('listreceivedbyaddress',['1','true']);
        self.isLoadingReceiveAddresses(true);
        var receivePromise = getReceivedByAddressesCommand.execute()
            .done(function(data){
                for (var k in data){
                    //console.log("data[k]:" + JSON.stringify(data[k]));
                    if (data[k].account !== self.account()){
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
