require.config({
    paths: {
        jQuery: 'jquery.min', // 2.2.4
        jquery: 'jquery.min', // 2.2.4
        sammy: "lib/sammy",
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

require( [ "app" ], function( App ){
    App.init();
});
