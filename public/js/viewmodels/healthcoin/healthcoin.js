define(['knockout'], function(ko){
    var healthcoinType = function(options){
        var self = this, opts = options || {};
        self.wallet = opts.parent;

        self.User = ko.observable("");
        self.node_id = ko.observable("");
        self.role = ko.observable("");
        self.name = ko.observable("");

        self.statusMessage = ko.observable("");
    };

    healthcoinType.prototype.load = function(User, node_id){
        var self = this;
        if (User && node_id){
            self.User(User);
            self.node_id(node_id);
            self.role(User.profile.role);
            self.name(User.profile.name);
        }
    };

    return healthcoinType;
});
