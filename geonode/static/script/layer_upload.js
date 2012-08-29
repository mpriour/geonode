/* steps:
 *  
 *
 *
 */

'use strict';
// globals vars.... 
var sep = '.',
    files = {}; // global var for debugging

var get_base = function(file) { return file.name.split(sep); };

var get_ext = function(file) { 
    var parts = get_base(file);
    return parts[parts.length - 1];
};

var get_name = function(file) { return get_base(file)[0]; };

// function to group files by name
var group_files = function(files) {
    return _.groupBy(files, get_name);
};


function LayerInfo(name, exts, type, errors, files) {
    this.name = name;
    this.exts = exts;
    this.type = type;
    this.errors = errors;
    this.files = files;
    // populate the type
    this._check_type();
};

LayerInfo.prototype._check_type = function() {
    var self = this;
    _.map(this.files, function(file) {
        var ext = get_ext(file);
        self.exts.push(ext);

        if (ext.toLowerCase() === 'shp') {
            self.type = 'shapefile';
        } else if (ext.toLowerCase() === 'tif') {
            self.tyoe = 'geotiff'
        };

    });

};

LayerInfo.prototype.collect_errors = function() {
    var self = this;
    if (self.type === 'shapefile') {
        self.collect_shape_errors();
    };

};

LayerInfo.prototype.collect_shape_errors = function() {
    var self = this;
    var required = ['shp', 'prj', 'dbf', 'shx'],
         extensions = _.toArray(self.exts);

    _.map(required, function(req) {
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

    _.map(self.errors, function(e) {
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
    
    self.display_errors(div);

    _.map(self.files, function (file) {
        self.display_file(table, file);
    });
};

LayerInfo.prototype.display_file = function(table, file) {
    var self = this,
         tr = $('<tr/>').appendTo(table);
    $('<td/>', {text: file.name}).appendTo(tr);
    $('<td/>', {text: file.size}).appendTo(tr);

};


var build_file_info = function(files) {
    var res = {};
    _.map(files, function(assoc_files, name) {

        var info = new LayerInfo(name, [], null, [], assoc_files);
        info.collect_errors();
        res[name] = info;
    });
    return res;
};


var display_errors = function(div, errors) {

};


var display_files = function(files) {
    var file_con= $('#file-queue');
    _.map(files, function(info, name) {
        info.display(file_con);
    });
};


var setup = function(options) {
    // jquery will not work for selecting an element because we need
    // access to the underlying file api

    var file_input = document.getElementById('file-input'),
        attach_events = function() {    
            $('#file-con a').click(function(event) {
                console.log(event);
            });
        },
        form = $('file-uploader');
    
    $('#file-uploader').change(function(event) {
        files = build_file_info(group_files(file_input.files));
        display_files(files);
        attach_events();
    });

    $('#upload-button').click(function(event) {
        var temp_file = files['nybb'].files[0];
        upload_files(temp_file);
    });

};