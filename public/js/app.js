define( [
        "jquery",
        "bootstrap",
        "bootstrap-editable",
        "knockout",
        "knockout-amd-helpers",
        "knockout-validation",
        "knockout-x-editable",
        "common/dialog",
        "viewmodels/healthcoin-wallet",
        "sammy",
        "bindinghandlers/modal",
        "bindinghandlers/numeric-text",
        "bindinghandlers/numeric-input",
        ], function(jQuery, bs, bse, ko, kah, kv, kxe, dialog, Wallet, Sammy){
    var $ = jQuery;
    var App = function(){
    };
    ko.amdTemplateEngine.defaultPath = "../views";
    ko.amdTemplateEngine.defaultSuffix = ".html";
    ko.amdTemplateEngine.defaultRequireTextPluginName = "text";
    ko.bindingHandlers.module.baseDir = "viewmodels";

    App.prototype.init = function() {
        var wallet = new Wallet();

        //$('.editable').editable.defaults.mode = 'inline'; // Comment or change to 'popup' (default)
        //$( document ).ready(function() {
            $('.editable').editable();
        //});

        ko.applyBindings(wallet, $('#wrapper')[0]);
        dialog.init($('#defaultModal')[0]);

        Sammy(function() {
            this.get('#healthcoin', function() {
                wallet.currentView('healthcoin');
            });
            this.get('#biomarkers', function() {
                wallet.currentView('biomarkers');
            });
            this.get('#send', function() {
                wallet.currentView('send');
            });
 
            this.get('#receive', function() {
                wallet.currentView('receive');
            });

            this.get('#history', function() {
                wallet.currentView('history');
            });

            this.get('#explore', function() {
                wallet.currentView('explore');
            });

            this.get('#console', function() {
                wallet.currentView('console');
            });

            this.get('#profile', function() {
                wallet.currentView('profile');
            });
        }).run('#healthcoin');
    };
    return new App();
});
