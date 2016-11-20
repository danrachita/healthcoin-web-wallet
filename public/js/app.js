define( [
        "jquery",
        "bootstrap",
        "bootstrap-editable",
        "knockout",
        "knockout-x-editable",
        "common/dialog",
        "viewmodels/healthcoin-wallet",
        "knockout-amd-helpers",
        "knockout-validation",
        "sammy",
        "bindinghandlers/numeric-text",
        "bindinghandlers/numeric-input",
        "bindinghandlers/modal"
        ], function($, bootstrap, bootstrapEditable, ko, kxe, dialog, Wallet, kah, kv, Sammy){
    var App = function(){
    };
    ko.amdTemplateEngine.defaultPath = "../views";
    ko.amdTemplateEngine.defaultSuffix = ".html";
    ko.amdTemplateEngine.defaultRequireTextPluginName = "text";
    ko.bindingHandlers.module.baseDir = "viewmodels";

    App.prototype.init = function() {
        var wallet = new Wallet();

        //$('.editable').editable.defaults.mode = 'inline'; // Comment or change to 'popup' (default)
        $('.editable').editable();

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
