define(['knockout'], function(ko){
    var healthcoinType = function(options){
        var self = this, opts = options || {};
        self.wallet = opts.parent;

        self.statusMessage = ko.observable("");
    };

    return healthcoinType;
});
