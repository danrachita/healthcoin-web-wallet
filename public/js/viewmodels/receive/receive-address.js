define(['knockout'], function(){
    var receiveAddressType = function(options){
        var addr = options.address || {};
        this.account = addr.account || '';
        this.address = addr.address || '';
        this.amount = addr.amount || 0.0;
        this.confirmations = addr.confirmations || 0;
        this.wallet = options.parent;
    }; 

    return receiveAddressType; 
});
