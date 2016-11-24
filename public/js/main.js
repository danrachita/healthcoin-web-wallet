require.config({
    paths: {
        jquery: 'lib/jquery.min', // 2.2.4
        sammy: "lib/sammy",
        moment: "lib/moment.min",
        bootstrap: 'lib/bootstrap.min',
        "bootstrap-editable": 'lib/bootstrap-editable-customized.min',
        knockout: 'lib/knockout',
        "knockout-amd-helpers": 'lib/knockout-amd-helpers',
        "knockout-validation": 'lib/knockout.validation.min',
        "knockout-x-editable": 'lib/knockout.x-editable.min',
        text: "lib/text",
        patterns: 'extenders/patterns'
    }
});

require( [ "jquery" ], function(jQuery){
        window.jQuery = window.$ = jQuery;
});
require( [ "sammy" ], function(){
});
require( [ "moment" ], function(){
});
require( [ "bootstrap" ], function(){
});
require( [ "bootstrap-editable" ], function(){
});
require( [ "knockout" ], function(){
});
require( [ "knockout-amd-helpers" ], function(){
});
require( [ "knockout-validation" ], function(){
});
require( [ "knockout-x-editable" ], function(){
});

require( [ "app" ], function( App ){
    App.init();
});
