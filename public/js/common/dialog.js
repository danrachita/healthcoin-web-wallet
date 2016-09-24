define(['knockout'],function(ko){
    var vm = { 
        modalView: ko.observable('modals/placeholder'),
        modalViewModel: ko.observable({text: ko.observable('Test')}),
        showDialog: ko.observable(false)
    };
    
    function openDialog(viewmodel,view){
        vm.showDialog(false);
        vm.modalView('modals/placeholder');
        vm.modalViewModel(viewmodel);
        vm.modalView(view);
        vm.showDialog(true);
    }

    function closeDialog(){
        vm.showDialog(false);
    };

    return {
        init: function(element){
            ko.applyBindings(vm, element);
        },        
        openDialog: function(viewmodel, view){
            openDialog(viewmodel, view);
        },
        closeDialog: function(){
            closeDialog();
        },
        notification: function(message,title){
            openDialog( { title: "Notification", message: message, closeDialog: closeDialog }, 'modals/notification');
        }
    };

    return dialogType;
});
