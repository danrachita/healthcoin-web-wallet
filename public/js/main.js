require.config({
    paths: {
        jquery: 'lib/jquery.min', // Reverted back to 2.2.4 for date picker bugs
        bootstrap: 'lib/bootstrap.min',
        "bootstrap-editable": 'lib/bootstrap-editable-customized.min',
        knockout: 'lib/knockout',
        sammy: "lib/sammy",
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
