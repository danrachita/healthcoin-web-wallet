define(['knockout'],function(ko){
    var newAddressDialogType = function(options){
        this.parent = options.parent;
        this.account = this.parent.account; // account is ko.observable
        this.address = ko.observable('');
    };

    newAddressDialogType.prototype.newAddressConfirm = function(){
       this.parent.newAddressConfirm(this.address(), this.account()); 
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
