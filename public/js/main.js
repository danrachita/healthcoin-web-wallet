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
require( [ "sammy" ] );
require( [ "moment" ] );
require( [ "bootstrap" ] );
require( [ "bootstrap-editable" ] );
require( [ "knockout" ] );
require( [ "knockout-amd-helpers" ] );
require( [ "knockout-validation" ] );
require( [ "knockout-x-editable" ] );

require( [ "app" ], function( App ){
    App.init();
});
