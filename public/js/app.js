define( [
        "jquery",
        "bootstrap",
        "bootstrap-editable",
        "knockout",
        "common/dialog",
        "viewmodels/healthcoin-wallet",
        "knockout-amd-helpers",
        "knockout-validation",
        "knockout-x-editable",
        "bindinghandlers/numeric-text",
        "bindinghandlers/numeric-input",
        "bindinghandlers/modal"
        ], function(jquery, bs, be, ko, dialog, Wallet){
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
        //    $('.editable').editable();
        //});

        ko.applyBindings(wallet, $('#wrapper')[0]);
        setTimeout(function(){
            dialog.init($('#defaultModal')[0]);
        },900); // Added short delay to solve TypeError on undefined element. (Must be under 1000 for main wallet init delay.)

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
