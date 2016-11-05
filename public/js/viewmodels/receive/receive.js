define(['knockout',
    'common/dialog',
    'viewmodels/receive/receive-address',
    'viewmodels/common/command',
    'viewmodels/receive/new-address-dialog'], function(ko,dialog,ReceiveAddress,Command,NewAddressDialog){
    var receiveType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.statusMessage = ko.observable("");

        self.account = ko.observable("");
        self.address = ko.observable("");
        self.addresses = ko.observableArray([]);
        self.isLoadingReceiveAddresses = ko.observable(false);
        self.isLoading = ko.computed(function(){
            var trans = self.isLoadingReceiveAddresses();
            return trans;
        });
        self.newAddressDialog = new NewAddressDialog({parent: self});
        self.showNewAddressDialog = ko.observable(false);
    };

    receiveType.prototype.load = function(User, node_id){
        var self = this;
        if (self.account() === ""){
            var found = false;
            // Get the account/address for the node_id
            var wallet = User.wallet.filter(function(wal){
                if(!found && wal.node_id === node_id){
                    found = true;
                    self.account(wal.account);
                    self.address(wal.address);
                    return wal;
                }
            });
            if (!found)
                console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
            else
                this.getReceiveAddresses();
        } else {
            this.getReceiveAddresses();
        }
    };

    receiveType.prototype.refresh = function(){
        this.getReceiveAddresses();
    };

    receiveType.prototype.newAddress = function(){
        dialog.openDialog(this.newAddressDialog, 'modals/new-address');
    };

    receiveType.prototype.newAddressConfirm = function(account, address){
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
        var self = this, listReceivedByAddressesCommand = new Command('listreceivedbyaddress',['1','true']);
        self.isLoadingReceiveAddresses(true);
        var receivePromise = listReceivedByAddressesCommand.execute()
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
