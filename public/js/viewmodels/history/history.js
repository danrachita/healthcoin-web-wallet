define(['knockout',
        'viewmodels/history/transaction',
        'viewmodels/wallet-status',
        'viewmodels/common/command'], function(ko,Transaction,WalletStatus,Command){
        var historyType = function(options){
            var self = this, opts = options || {};
            self.wallet = opts.parent;

            this.account = ko.observable("");
            this.page = ko.observable(1);
            this.pageFirst = ko.observable(-1);
            this.pagePrev = ko.observable(0);
            this.pageNext = ko.observable(2);
            this.pageLast = ko.observable(99999999);
            this.transactions = ko.observableArray([]);
            this.isLoadingTransactions = ko.observable(false);

            this.isLoading = ko.computed(function(){
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
                        self.account(wal.account); // First time load
                        return wal;
                    }
                });
                if (!found)
                    console.log("Error: wallet not found for this node:" + JSON.stringify(wallet) + " node_id:" + node_id);
                else
                    this.getTransactions(this.account(), this.page());
            } else {
                this.getTransactions(this.account(), this.page());
            }
        };

        historyType.prototype.firstPage = function(){
            this.getTransactions(this.account(), this.pageFirst());
        };
        historyType.prototype.prevPage = function(){
            this.getTransactions(this.account(), this.pagePrev());
        };
        historyType.prototype.nextPage = function(){
            this.getTransactions(this.account(), this.pageNext());
        };
        historyType.prototype.lastPage = function(){
            this.getTransactions(this.account(), this.pageLast());
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
