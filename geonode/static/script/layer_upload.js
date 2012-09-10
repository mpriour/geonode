/*global $:true, FileReader:true, XMLHttpRequest:true, FormData:true, document:true, alert:true  */

/*
 * TODO, when removing a .prj from a shape file.. we should give the
 * user an warning, not an error.
 * 1. Add templates
 * 2. Fix csrf_token
 * 3. Move class defs into their own files
 * 4. Put everything into a namespace
 */

'use strict';
var underscore = _.noConflict();

var UPLOAD = (function () {

    var layers = {},
        FileType,
        LayerInfo,
        find_file_type,
        initialize,
        get_base,
        get_ext,
        get_name,
        group_files,
        layer_template,
        shp,
        tif,
        csv,
        types,
        remove_file,
        build_file_info,
        display_files,
        do_uploads,
        file_input,
        attach_events,
        file_queue = $('#file-queue');

    file_input = document.getElementById('file-input');

    get_base = function (file) { return file.name.split('.'); };

    get_ext = function (file) {
        var parts = get_base(file);
        return parts[parts.length - 1];
    };

    get_name = function (file) { return get_base(file)[0]; };

    group_files = function (files) {
        return underscore.groupBy(files, get_name);
    };

    FileType = function (name, main, requires) {
        this.name     = name;
        this.main     = main;
        this.requires = requires;

    };

    FileType.prototype.is_type = function (file) {
        return (this.main === get_ext(file).toLowerCase());
    };

    FileType.prototype.find_type_errors = function (extensions) {
        var errors = [];

        $.each(this.requires, function (idx, req) {
            idx = $.inArray(req, extensions);
            if (idx === -1) {
                errors.push('Missing a ' + req + ' file, which is required');
            }
        });
        return errors;

    };

    shp = new FileType('ESRI Shapefile', 'shp', ['shp', 'prj', 'dbf', 'shx']);
    tif = new FileType('GeoTiff File', 'tif', ['tif']);
    csv = new FileType('Comma Separated File', 'csv', ['csv']);

    types = [shp, tif, csv];

    /* Function to iterates through all of the known types and returns the
     * type if it matches, if not return null
     *
     * File object must have a name property.
     */
    find_file_type = function (file) {
        var i, type;
        for (i = 0; i < types.length; i += 1) {
            type = types[i];
            if (type.is_type(file)) {
                return type;
            }
        }
    };

    /* LayerInfo is a container where we collect information about each
     * layer an user is attempting to upload.
     * 
     * Each LayerInfo has a
     *   1. type
     *   2. a list of associated files
     *   3. a list of errors that the user should address
     */
    LayerInfo = function (name, type, errors, files, element) {
        this.name    = name;
        this.type    = type;
        this.errors  = errors;
        this.files   = files;
        this.element = element;
        this.check_type();

    };

    LayerInfo.prototype.check_type = function () {
        var self = this;
        $.each(this.files, function (idx, file) {
            var type = find_file_type(file);
            if (type) {
                self.type = type;
            }
        });
    };

    LayerInfo.prototype.collect_errors = function () {
        this.errors = []; // hard reset of errors, FIXME
        this.errors = this.type.find_type_errors(this.get_extensions());
    };

    LayerInfo.prototype.get_extensions = function () {
        var files = this.files,
            extension,
            file,
            res = [],
            i;

        for (i = 0; i < files.length; i += 1) {
            file = files[i];
            extension = get_ext(file);
            res.push(extension);
        }
        return res;
    };

    LayerInfo.prototype.upload_files = function () {
        var reader = new FileReader(),
            xhr = new XMLHttpRequest(),
            form_data = new FormData();

        xhr.open('POST', '', true);
        form_data.append('main', this.files[0]);
        xhr.send(form_data);

    };

    LayerInfo.prototype.display_errors = function (div) {
        var alert;
        $.each(this.errors, function (idx, e) {
            alert = $('<div/>', {'class': 'alert alert-error'}).appendTo(div);
            $('<p/>', {text: e}).appendTo(alert);

        });
    };

    /* template for the layer info div */
    layer_template = underscore.template(
        '<div class="file-element" id="<%= name %>-element">' +
            '<div>' +
               '<div><h3><%= name %></h3></div>' +
               '<div><p><%= type %></p></div>' +
            '</div>' +
            '<ul class="files"></ul>' +
            '<ul class="errors"></ul>' +
            '</div>'
    );

    LayerInfo.prototype.display  = function () {
        var errors,
            li = layer_template({
                name: this.name,
                type: this.type.name,
                files: this.files
            });
        file_queue.append(li);
        this.display_files();
        this.display_errors();

    };

    remove_file = function (event) {
        var target = $(event.target),
            layer_info,
            layer_name = target.data('layer'),
            file_name  = target.data('file');

        layer_info = layers[layer_name];

        if (layer_info) {
            layer_info.remove_file(file_name);
            layer_info.collect_errors();
            layer_info.display_files();
            layer_info.display_errors();
        }

    };

    LayerInfo.prototype.display_files = function () {
        var self = this,
            ul = $('#' + this.name + '-element .files');
        ul.empty();

        $.each(this.files, function (idx, file) {
            var li = $('<li/>').appendTo(ul),
                p = $('<p/>', {text: file.name}).appendTo(li),
                a  = $('<a/>', {text: ' Remove'});
            a.data('layer', self.name);
            a.data('file',  file.name);
            a.appendTo(p);
            a.click(function (event) {
                remove_file(event);
            });
        });

    };

    LayerInfo.prototype.display_errors = function () {
        var ul = $('#' + this.name + '-element .errors').first();
        ul.empty();

        $.each(this.errors, function (idx, error) {
            $('<li/>', {text: error, 'class': 'alert alert-error'}).appendTo(ul);
        });
    };

    LayerInfo.prototype.remove_file = function (name) {
        var length = this.files.length, i, file;

        for (i = 0; i < length; i += 1) {
            file = this.files[i];
            if (name === file.name) {
                this.files.splice(i, 1);
            }
        }

    };

    build_file_info = function (files) {
        var info;
        $.each(files, function (name, assoc_files) {
            if (layers.hasOwnProperty(name)) {
                // check if the `LayerInfo` object already exists
                info = layers[name];
                $.merge(info.files, assoc_files);
                info.collect_errors();
            } else {
                info = new LayerInfo(name, null, [], assoc_files);
                layers[name] = info;
                info.collect_errors();
            }
        });

    };

    display_files = function () {
        //file_queue.empty();

        $.each(layers, function (name, info) {
            info.display();

        });
    };

    do_uploads = function () {
        $.each(layers, function (name, layer) {
            layer.upload_files();
        });
    };

    initialize = function (options) {

        $('#file-uploader').change(function (event) {
            var files = group_files(file_input.files);
            build_file_info(files);
            display_files();
        });

        $('#upload-button').click(function (event) {
            // attach the event that uploads a single layer 
            if ($.isEmptyObject(layers)) {
                alert('You must select some files first.');
            } else {
                do_uploads();
            }
        });
    };

    // public api
    return {
        layers: layers,
        LayerInfo: LayerInfo,
        FileType: FileType,
        types: types,
        find_file_type: find_file_type,
        initialize: initialize
    };

}());