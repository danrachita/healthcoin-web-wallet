define(['knockout','common/utility'], function(ko,utils){
    var transactionType = function(options){
        var txn = options.transaction || {};
        this.account = txn.account || '';
        this.address = txn.address || '';
        this.category = txn.category || '';
        this.amount = txn.amount || 0.0;
        this.txcomment = (txn.txcomment ? txn.txcomment.replace(/^text:/, '').replace(/^hcbm:[\w]+/, '[bio-marker]') : '');
        this.confirmations = txn.confirmations || 0;
        this.blockHash = txn.blockhash || '';
        this.fee = txn.fee || null;
        this.blockIndex = txn.blockindex || 0;
        this.blockTime = txn.blocktime ? utils.time.unixToDate(txn.blocktime) : new Date();
        this.transactionId = txn.txid || '';
        this.time = txn.time ? utils.time.unixToDate(txn.time) : new Date();
        this.timeReceived = txn.time ? utils.time.unixToString(txn.timereceived) : new Date();
    }; 

    return transactionType; 
});
