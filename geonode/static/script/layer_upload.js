'use strict';

var sep = '.',
    layers = {},
    file_queu= $('#file-queue');

var get_base = function(file) { return file.name.split(sep); };

var get_ext = function(file) { 
    var parts = get_base(file);
    return parts[parts.length - 1];
};

var get_name = function(file) { return get_base(file)[0]; };

var group_files = function(files) {
    return _.groupBy(files, get_name);
};


var FileInfo = function(name) {
    this.name = name;
};

var FileType = function(name, main, requires) {
    this.name     = name;
    this.main     = main;
    this.requires = requires;

};

FileType.prototype.is_type = function(file) {
    return (this.main === get_ext(file).toLowerCase());
};

var shp = new FileType('ESIR Shapefile', 'shp', ['shp', 'prj', 'dbf', 'shx', 'xml']);
var tif = new FileType('GeoTiff File', 'tif', ['tif']);
var csv = new FileType('Comma Separated File', 'csv', ['csv']);

var types = [shp, tif, csv]

var find_file_type = function(file) {
    for (var i = 0; i < types.length; i ++) {
        var type = types[i]
        if (type.is_type(file)) {
            return type;
        };
    };
};


/* LayerInfo is a container where we collect information about each
 * layer an user is attempting to upload.
 * 
 * Each LayerInfo has a
 *   1. type
 *   2. a list of associated files
 *   3. a list of errors that the user should address
 */
var LayerInfo = function(name, type, errors, files, element) {
    this.name    = name;
    this.type    = type;
    this.errors  = errors;
    this.files   = files;
    this.element = element;

    this._check_type();

};

LayerInfo.prototype._check_type = function() {
    var self = this;

    $.each(this.files, function(idx, file) {

        var ext = get_ext(file);

        switch (ext) {
        case 'shp':
            self.type = 'shapefile';
            break;
        case 'tif':
            self.type = 'geotif';
            break;
        };
    });

};

LayerInfo.prototype.collect_errors = function() {
    var self = this;
    self.errors = [];
    if (self.type === 'shapefile') {
        self.collect_shape_errors();
    };

};

LayerInfo.prototype.get_extensions = function() {
    var files = this.files,
        res = [];
    for (var i = 0; i < files.length; i++) {
        var file = files[i], 
            extension = get_ext(file);
        res.push(extension);
    };
    return res;
};

LayerInfo.prototype.collect_shape_errors = function() {
    var self = this,
        required = ['shp', 'prj', 'dbf', 'shx', 'xml'],
        extensions = this.get_extensions();

    $.each(required, function(idx, req) {
        var idx = $.inArray(req, extensions);
        if (idx === -1) {
            self.errors.push('Missing a ' + req + ' file, which is required');
        };
    });

};


LayerInfo.prototype.upload_files = function() {
    var self = this,
        reader = new FileReader(),
        xhr = new XMLHttpRequest(),
        form_data = new FormData();

    xhr.open('POST', '/upload', true);
    form_data.append('main', file);
    xhr.send(form_data);
};

LayerInfo.prototype.display_errors = function(div) {
    var self = this;

    $.each(self.errors, function(idx, e) {
        var alert = $('<div/>', {'class': 'alert alert-error'}).appendTo(div);
        $('<p/>', {text: e}).appendTo(alert);
    
    });

};

LayerInfo.prototype.display  = function(file_con) {

    var self = this,
        div   = $('<div/>').appendTo(file_con),
         table = $('<table/>', {
             'class': 'table table-bordered'}).appendTo(div),
         thead = $('<thead/>').appendTo(table);

    $('<th/>', {text: 'Name'}).appendTo(thead);
    $('<th/>', {text: 'Size'}).appendTo(thead);
    $('<th/>').appendTo(thead);
    self.display_errors(div);

    $.each(self.files, function(idx, file) {
        self.display_file(table, file);
    });
};

/* Remove the div and remove the file from the LayerInfo object
 *
 */
var remove_file = function(element) {
    element.click(function(event) {
        var target     = $(event.target),
            layer_name = target.data('name'),
            file_name  = target.data('file'),
            layer_info = layers[layer_name];

        for (var i = 0; i < layer_info.files.length; i++) {
            var file = layer_info.files[i];
            if (file.name == file_name) {
                layer_info.files.splice(i, 1);
            };
        };
        layer_info.collect_errors();
        file_queu.empty();
        layer_info.display(file_queu);
    });
};

LayerInfo.prototype.display_file = function(table, file) {
    var self = this,
         tr = $('<tr/>').appendTo(table),
         remove = $('<a/>', {text: 'Remove'}),
         control = $('<td/>').appendTo(tr);

    $('<td/>', {text: file.name}).appendTo(tr);
    $('<td/>', {text: file.size}).appendTo(tr);

    control.appendTo(tr);
    remove.data('name', self.name);
    remove.data('file', file.name);
    remove.appendTo(control);
    remove_file(remove);
};

/* When an user uploads a file, we need to check to see if there is
 * already an `LayerInfo` in the global layers object. If there is,
 * append that file to that `LayerInfo` object. Other wise create a
 * new `LayerInfo` object and add that to global Layers object.
 */

var build_file_info = function(files) {


    $.each(files, function(name, assoc_files) {
        if (name in layers) {
            // check if the `LayerInfo` object already exists
            var info = layers[name]
            $.merge(info.files, assoc_files);
            info.collect_errors();
        } else {
            var info = new LayerInfo(name, null, [], assoc_files);
            layers[name] = info;
            info.collect_errors();
        };
    });

};

var display_files = function(files) {
    file_queu.empty();

    $.each(files, function(name, info) {
        info.display(file_queu);
    });
};

var setup = function(options) {

    var file_input = document.getElementById('file-input'),
        attach_events = function() {    
            $('#file-con a').click(function(event) {
                console.log(event);
            });
        },
        form = $('file-uploader');
    
    $('#file-uploader').change(function(event) {
        var grouped_files = group_files(file_input.files);
        build_file_info(grouped_files);
        display_files(layers);
        attach_events();
    });

    $('#upload-button').click(function(event) {
        var temp_file = files['nybb'].files[0];
        upload_files(temp_file);
    });

};