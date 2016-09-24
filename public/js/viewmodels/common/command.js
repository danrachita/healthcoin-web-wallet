define(['knockout'],function(ko){

    var commandType = function(commandName, args){
        this.commandName = ko.observable(commandName);
        this.args = ko.observableArray(args);
    };

    function parseCommand(commandText, args){
        //var url = 'http://127.0.0.1:8181/';
        var url = 'http://' + window.location.hostname + ':8181/'; // SDW
        url = url.concat(commandText.concat('/'));
        if(args && args.length > 0){
            url = url.concat(args.join('/'));
        }
        return url;
    }

    commandType.prototype.execute = function(){
        var self = this, deferred = $.Deferred();
        $.ajax({
            async: true,
            method: 'GET',
            url: parseCommand(self.commandName(), self.args()),
            dataType: 'json'
        }).done(function(data){
            console.log(data);
            if(data.error){
                deferred.reject(data.error.error);
            }
            else{
                deferred.resolve(data.result);
            }
        }).fail(function(jqXHR,textStatus,errorThrown){
            console.log("Ajax call failure: ");
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
            deferred.reject({ code: jqXHR.status, message: "Request failed: " + jqXHR.responseText });
        });;
        return deferred.promise();
    };

    return commandType;
});
