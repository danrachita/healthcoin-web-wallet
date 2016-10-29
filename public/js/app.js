define( [
        "knockout",
        "common/dialog",
        "viewmodels/healthcoin-wallet",
        "knockout-amd-helpers",
        "knockout-validation",
        "bindinghandlers/modal",
        "bindinghandlers/numeric-text",
        "bindinghandlers/numeric-input",
        "text"], function( ko, dialog, Wallet){
    var App = function(){
    };
    ko.amdTemplateEngine.defaultPath = "../views";
    ko.amdTemplateEngine.defaultSuffix = ".html";
    ko.amdTemplateEngine.defaultRequireTextPluginName = "text";
    ko.bindingHandlers.module.baseDir = "viewmodels";

    App.prototype.init = function() {
        var wallet = new Wallet();

        ko.applyBindings(wallet, $('#wrapper')[0]);
        dialog.init($('#defaultModal')[0]);
        $.fn.editable.defaults.mode = 'inline';

        Sammy(function() {
            this.get('#', function() {
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

        }).run('#biomarkers');
    };
    return new App();
});
