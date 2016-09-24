require.config({
    paths: {
        knockout: 'lib/knockout-3.3.0.debug',
        "knockout-amd-helpers": 'lib/knockout-amd-helpers',
        "knockout-validation": 'lib/knockout.validation.min',
        patterns: 'extenders/patterns',
        text: "lib/text"
    }
});
 
require( [ "app" ], function( App ) {
    App.init();
})
