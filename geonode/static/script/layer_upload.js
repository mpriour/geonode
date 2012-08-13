var file_list = $('#file-list');

var load_file_selections = function(data) {    
    // whats the difference between original files and files.
    var files = data.files;

    for (var i = 0; i< files.length; i++) {
        var file = files[i];
        $('<p/>', {text: file.name}).appendTo(file_list);
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
        drop: function(e, data) {
            load_file_selections(data);

        },
        add: function(e, data) {
            load_file_selections(data);

        }
        
    });
    
};
