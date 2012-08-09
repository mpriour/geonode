
var build_input = function(options) {
    return $('<input />', {
        type: 'file',
        name: options.name,
    })
};

var dbf_file = build_input({
     name: 'dbf_file'
});

var prj_file = build_input({
    name: 'prj_file'
});

var shx_file = build_input({
    name: 'shx_file'
});


var load_shapefile_inputs = function() {
    var main_form = $('#upload_form');
    dbf_file.appendTo(main_form);
    prj_file.appendTo(main_form);
    shx_file.appendTo(main_form);
};

var disable_shapefile_inputs = function() {
    dbf_file.remove();
    prj_file.remove();
    shx_file.remove();
};

var do_main_action = function(event, data) {
    // get the first and only file in the form at this point
    var main_file = data.files[0],
        main_name = main_file.name.toLowerCase();
    
    if ((/\.shp$/i).test(main_name)) {
        load_shapefile_inputs();
    } else {
        disable_shapefile_inputs();
    }; 

};

var setup = function(options) {
    var csrf_token  = options.csrf_token,
        form_target = options.form_target,
        user_lookup = options.user_lookup,
        form        = $('#upload_form'),
        container = $('#upload_form_con');


    form.fileupload({
        dataType: 'json',
        done: function(e, data) {
            do_main_action(e, data);

        }
        
    });
    
};
