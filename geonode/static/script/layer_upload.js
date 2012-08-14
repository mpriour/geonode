

var global_files = {},
    file_container = $('#file-container');

var get_or_populate = function(hash, key, callback) {
    if (typeof hash[key] === 'undefined') {
        hash[key] = callback();
    };
    return hash[key];
};


var base = function(name) {
    return name.split('.')[0];
};

var group_by_name = function(data) {

    $.each(data.files, function(idx, file) {
        var name = base(file.name);
        get_or_populate(global_files, name, function() {return []});
        global_files[name].push(file);
    });

};

var redraw = function() {

    file_container.empty();

    for(var name in global_files) {

        var div = $('<div/>', {id: 'div-' + name}),
            title = $('<p/>', {text: 'Uploading shapefile: ' + name}).appendTo(div),
            ul = $('<ul/>').appendTo(div);

        div.appendTo(file_container);

        $.each(global_files[name], function(idx, file) {
            var li = $('<li/>', {text: file.name}).appendTo(ul);
                
        });

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
        dropZone: $('#dropzone'),
        add: function(e, data) {
            group_by_name(data);
            redraw();
        }

    });
    
};
