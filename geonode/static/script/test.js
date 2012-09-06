/*global setup:true, types: true, test: true, ok:true, equal:true, get_ext: true, get_name: true, FileType: true, find_file_type: true*/

'use strict';

module('main tests', {
    setup: function () {
        setup({});
    },
});

test('test split the file name', function () {

    equal(get_ext({name: 'hello.shp'}), 'shp', 'Make sure that we get the correct extension');
    equal(get_name({name: 'hello.shp'}), 'hello', 'Make sure we get the correct file name');
});

test('test creating a filetype object', function () {
    var blah = new FileType('Blah type', 'blah', ['blah', 'more-blah']),
        esri = find_file_type({'name': 'hello.shp'}),
        blah_type = find_file_type({'name': 'hello.blah'});

    equal(blah.name, 'Blah type');
    ok(blah.is_type({name: 'file.blah'}), 'Double check that we can correctly identify a file type');

    // locate a shapefile
    equal(typeof esri, "object");

    equal(typeof blah_type, 'undefined');

    // make sure we have enough types
    equal(types.length, 3);
    // add our blah type
    types.push(blah);
    equal(types.length, 4);

});