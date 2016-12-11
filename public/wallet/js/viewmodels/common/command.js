define(['knockout'],function(ko){

    var commandType = function(commandName, args, env){
        this.commandName = ko.observable(commandName);
        this.args = ko.observableArray(args);
        this.env = ko.observable(env || '');
    };

    function parseCommand(commandName, args){
        var port = (window.location.port === '' ? '' : ":" + window.location.port);
        var url = window.location.protocol + '//' + window.location.hostname + port + '/'; // Allow CORS
        url = url.concat(commandName.concat('/'));
        if(args && args.length > 0){
            url = url.concat(args.join('/'));
        }
        return url;
    }

    commandType.prototype.execute = function(){
        var self = this, deferred = $.Deferred();
        var url = parseCommand(self.commandName(), self.args());
        $.ajax({
            async: true,
            method: 'GET',
            url: url,
            dataType: 'json'
        }).done(function(data){
            if (self.env() === 'development'){
                console.log("Command Data For:\n" + url);
                console.log(data);
            }
            if(data.error){
                if (self.env() === 'development'){
                    console.log("Command Error For:\n" + url);
                }
                deferred.reject(data.error.error);
            } else {
                deferred.resolve(data.result);
            }
        }).fail(function(jqXHR,textStatus,errorThrown){
            console.log("Ajax call failure: ");
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
            deferred.reject({ code: jqXHR.status, message: "Request failed: " + jqXHR.responseText });
        });
        return deferred.promise();
    };

    return commandType;
});
