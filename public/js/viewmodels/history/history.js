define(['knockout',
    'viewmodels/common/transaction',
    'viewmodels/wallet-status',
    'viewmodels/common/command'], function(ko,Transaction,WalletStatus,Command){
    var historyType = function(options){
        var self = this;
        self.wallet = options.parent;

        self.statusMessage = ko.observable("");

        self.account = ko.observable("");
        self.address = ko.observable("");
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
    };

    historyType.prototype.load = function(User, node_id){
        var self = this;
        if (self.account() === ""){
            var found = false;
            // Get the account for the node_id
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
                this.getTransactions(self.account(), self.page());
        } else {
            this.getTransactions(self.account(), self.page());
        }
    };

    historyType.prototype.refresh = function(){
        this.getTransactions(self.account(), self.page());
    };

    historyType.prototype.firstPage = function(){
        this.getTransactions(self.account(), self.pageFirst());
    };
    historyType.prototype.prevPage = function(){
        this.getTransactions(self.account(), self.pagePrev());
    };
    historyType.prototype.nextPage = function(){
        this.getTransactions(self.account(), self.pageNext());
    };
    historyType.prototype.lastPage = function(){
        this.getTransactions(self.account(), self.pageLast());
    };

    historyType.prototype.getTransactions = function(account, page){
        var self = this,
            getTransactionsCommand = new Command('listtransactions', [account, page]); // For pagination
        self.isLoadingTransactions(true);
        var historyPromise = getTransactionsCommand.execute()
            .done(function(data){
                var i = 0, maxRows = 10;   // TODO: 10 needs to be an option
                //var descendingTxns = data.reverse();
                //self.transactions(ko.utils.arrayMap(descendingTxns,function(transaction){
                self.transactions(ko.utils.arrayMap(data, function(transaction){
                    i++;
                    return new Transaction({ transaction });
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
