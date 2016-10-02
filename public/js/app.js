define( [ 
        "knockout",
        "viewmodels/healthcoin-wallet",
        "common/dialog",
        "knockout-amd-helpers",
        "knockout-validation",
        "text",
        "bindinghandlers/modal",
        "bindinghandlers/numeric-text",
        "bindinghandlers/numeric-input"], function( ko, Wallet, dialog){
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

        Sammy(function() {
            this.get('#healthcoin', function() {
                wallet.currentView('healthcoin');                 
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

            this.get('#console', function() {
                wallet.currentView('console');                 
            });

        //}).run('#healthcoin');
        }).run('/');
    };
    return new App();
});
