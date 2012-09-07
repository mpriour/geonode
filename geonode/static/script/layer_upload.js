/*global $: true, FileReader:true, XMLHttpRequest: true, FormData: true, document: true, alert:true  */

'use strict';
var setup = function (options) {

    var sep = '.',
        layers = {},
        get_base,
        get_ext,
        get_name,
        group_files,
        FileType,
        LayerInfo,
        shp,
        tif,
        csv,
        types,
        find_file_type,
        remove_file,
        build_file_info,
        display_files,
        do_uploads,
        file_input,
        attach_events,
        file_queu = $('#file-queue'),
        csrf_token   = options.csrf_token,
        form_target  = options.form_target,
        user_lookup  = options.user_lookup,
        form = $('file-uploader');

    file_input = document.getElementById('file-input');

    get_base = function (file) { return file.name.split(sep); };

    get_ext = function (file) {
        var parts = get_base(file);
        return parts[parts.length - 1];
    };

    get_name = function (file) { return get_base(file)[0]; };

    group_files = function (files) {
        return _.groupBy(files, get_name);
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

    shp = new FileType('ESIR Shapefile', 'shp', ['shp', 'prj', 'dbf', 'shx', 'xml']);
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
        var self = this,
            reader = new FileReader(),
            xhr = new XMLHttpRequest(),
            form_data = new FormData();

        xhr.open('POST', '/data/upload', true);
        form_data.append('main', this.files[0]);
        xhr.send(form_data);

    };

    LayerInfo.prototype.display_errors = function (div) {
        var self = this,
            alert;

        $.each(self.errors, function (idx, e) {
            alert = $('<div/>', {'class': 'alert alert-error'}).appendTo(div);
            $('<p/>', {text: e}).appendTo(alert);

        });

    };

    LayerInfo.prototype.display  = function (file_con) {

        var self = this,
            div   = $('<div/>').appendTo(file_con),
            table = $('<table/>', {'class': 'table table-bordered'}).appendTo(div),
            thead = $('<thead/>').appendTo(table);

        $('<th/>', {text: 'Name'}).appendTo(thead);
        $('<th/>', {text: 'Size'}).appendTo(thead);
        $('<th/>').appendTo(thead);
        self.display_errors(div);

        $.each(self.files, function (idx, file) {
            self.display_file(table, file);
        });
    };

    /* Remove the div and remove the file from the LayerInfo object
     * FIXME, this is a mess
     */
    remove_file = function (element) {
        element.click(function (event) {
            var target     = $(event.target),
                i,
                file,
                layer_name = target.data('name'),
                file_name  = target.data('file'),
                layer_info = layers[layer_name];

            for (i = 0; i < layer_info.files.length; i += 1) {
                file = layer_info.files[i];

                if (file.name === file_name) {
                    layer_info.files.splice(i, 1);
                }
            }
            layer_info.collect_errors();
            file_queu.empty();
            layer_info.display(file_queu);
        });
    };

    LayerInfo.prototype.display_file = function (table, file) {
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

    build_file_info = function (files) {
        var info;

        $.each(files, function (name, assoc_files) {

            if (name in layers) {
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

    display_files = function (files) {
        file_queu.empty();

        $.each(files, function (name, info) {
            info.display(file_queu);
        });
    };

    do_uploads = function () {

        $.each(layers, function (name, layer) {
            layer.upload_files();
        });

    };




    attach_events = function () {
        $('#file-con a').click(function (event) {
            console.log(event);
        });
    };


    $('#file-uploader').change(function (event) {
        var grouped_files = group_files(file_input.files);
        build_file_info(grouped_files);
        display_files(layers);
        attach_events();
    });

    $('#upload-button').click(function (event) {
        // attach the event that uploads a single layer 

        if ($.isEmptyObject(layers)) {
            alert('You must upload some files first.');
        } else {
            do_uploads();
        }

    });

};