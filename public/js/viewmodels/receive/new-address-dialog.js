define(['knockout'],function(ko){
    var newAddressDialogType = function(options){
        this.parent = options.parent;
        this.account = ko.observable(this.parent.wallet.account());
        this.address = ko.observable('');
    };

    newAddressDialogType.prototype.newAddressConfirm = function(){
       this.parent.newAddressConfirm(this.account(), this.address());
       this.reset();
    };

    newAddressDialogType.prototype.newAddressCancel = function(){
       this.reset();
       this.parent.newAddressCancel();
    };

    newAddressDialogType.prototype.reset = function(){
        this.account('');
        this.address('');
    };

    return newAddressDialogType;
});
