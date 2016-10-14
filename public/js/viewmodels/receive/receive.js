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
            this.account(User.wallet.hcn_account); // First time load

        this.getReceiveAddresses();
    };

    receiveType.prototype.newAddress = function(){
        dialog.openDialog(this.newAddressDialog, 'modals/new-address');
    };

    receiveType.prototype.newAddressConfirm = function(address, account){
        var self = this, getNewAddressCommand = new Command('getnewaddress',[self.account()]); // Use self.account() to be safe.
        getNewAddressCommand.execute()
            .done(function(address){
                self.addresses.push(new ReceiveAddress({address:{ address: address, account: account }}));
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
                self.addresses(ko.utils.arrayMap(data,function(address, account){
                    if (account === self.account())
                        return new ReceiveAddress({address:{ address: address, account: account }});
                }));
                self.isLoadingReceiveAddresses(false); 
            });
        return receivePromise;
    };
    return receiveType; 
});
