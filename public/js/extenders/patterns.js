define(function(){
    return {
        healthcoin: /^[H][a-km-zA-HJ-NP-Z0-9]{33}$/, // base64, 33 chars begining with 'H'
        biomarker: /^[\x00-\x7F]{4,4096}$/,          // ascii, 4 to 4096 chars
        foo: "bar"
    };
});
