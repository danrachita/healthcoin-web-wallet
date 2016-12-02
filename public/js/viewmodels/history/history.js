define(['knockout',
    'viewmodels/common/transaction',
    'viewmodels/wallet-status',
    'viewmodels/common/command'], function(ko,Transaction,WalletStatus,Command){
    var historyType = function(options){
        var self = this;
        self.wallet = options.parent || {};

        self.page = ko.observable(1);
        self.pageFirst = ko.observable(-1);
        self.pagePrev = ko.observable(0);
        self.pageNext = ko.observable(2);
        self.pageLast = ko.observable(99999999);
        self.transactions = ko.observableArray([]);
        self.isLoadingTransactions = ko.observable(false);

        self.isLoading = ko.computed(function(){
            var trans = self.isLoadingTransactions();
            return trans;
        });

        self.statusMessage = ko.observable("");
    };

    historyType.prototype.refresh = function(){
        var self = this;
        // Add short delay to healthcoin-wallet's initial short timeout
        setTimeout(function(){
            if (self.wallet.account() !== ""){
                self.getTransactions(self.wallet.account(), self.page());
            }
        },2000);
    };

    historyType.prototype.firstPage = function(){
        var self = this;
        this.getTransactions(self.wallet.account(), self.pageFirst());
    };
    historyType.prototype.prevPage = function(){
        var self = this;
        this.getTransactions(self.wallet.account(), self.pagePrev());
    };
    historyType.prototype.nextPage = function(){
        var self = this;
        this.getTransactions(self.wallet.account(), self.pageNext());
    };
    historyType.prototype.lastPage = function(){
        var self = this;
        this.getTransactions(self.wallet.account(), self.pageLast());
    };

    historyType.prototype.getTransactions = function(account, page){
        var self = this,
            getTransactionsCommand = new Command('listtransactions', [account, page], self.wallet.settings().env); // For pagination
        self.isLoadingTransactions(true);
        var historyPromise = getTransactionsCommand.execute()
            .done(function(data){
                var i = 0, maxRows = 10;   // TODO: 10 needs to be an option
                //var descendingTxns = data.reverse();
                //self.transactions(ko.utils.arrayMap(descendingTxns,function(transaction){
                self.transactions(ko.utils.arrayMap(data, function(transaction){
                    i++;
                    return new Transaction(transaction);
                }));
                if (page === self.pageLast()) page = self.pageNext(); // Go to last: page=99999999
                if (page === self.pageFirst()) page = 1; // Go to first: page=-1
                if (i > 0){
                    if (i < maxRows){
                        self.pagePrev(page-1);
                        self.pageNext(0);
                    } else {
                        self.pagePrev(page-1);
                        self.pageNext(page+1);
                    }
                } else {
                    if (page > 1){
                        self.pagePrev(page-1);
                        self.pageNext(0);
                    } else {
                        self.pagePrev(0);
                        self.pageNext(2);
                        page = 1;
                    }
                }
                self.page(page);
                self.isLoadingTransactions(false);
            });
        return historyPromise;
    };

    return historyType;
});
