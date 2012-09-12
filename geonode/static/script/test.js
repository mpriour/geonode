/*global UPLOAD:true, test:true, ok:true, equal:true, deepEqual:true, FormData:true, QUnit:true, strictEqual:true */
'use strict';
QUnit.config.reorder = false;
var up = UPLOAD;

module('Test the FileType object');
test('Test the FileType object', function () {
    var type = new up.FileType('Test Type', 'test', ['req']);

    ok(type instanceof up.FileType, 'Does new return the correct object');
    strictEqual(type.main, 'test', 'Is the main type correct');
    strictEqual(type.name, 'Test Type', 'Is the name correct');
    ok(type.is_type('file.test'), 'Can the type identify its own type');

    deepEqual(type.find_type_errors(['req']), [], 'Can the type check errors correctly');

});

module('Test LayerInfo on Shapefile');
test('Test LayerInfo object on a error free Shapefile', function () {
    var shape_info = new up.LayerInfo(
        'nybb',
        ['nybb.shp', 'nybb.dbf', 'nybb.prj', 'nybb.shx']
    ),
        form_data = shape_info.prepare_form_data();

    ok(shape_info instanceof up.LayerInfo, 'Make sure the constructor returns the correct object');
    // our test file is an shapefile
    strictEqual(shape_info.type, up.shp, 'Make sure we identify the correct type');

    deepEqual(shape_info.get_extensions(), ['shp', 'dbf', 'prj', 'shx'], 'Find the correct extensions');
    strictEqual(shape_info.main, 'nybb.shp');

    ok(form_data instanceof FormData, 'The prepare_form_data method needs return a FormData');

    // check the errors array
    strictEqual(shape_info.errors.length, 0);
    // make sure that all of the associated files are correct
    equal(shape_info.files.length, 4);

});

test('Test LayerInfo on an invalid shapefile', function () {
    var bad_info = new up.LayerInfo('nybb', ['nybb.shp']);
    strictEqual(bad_info.type, up.shp);
    strictEqual(bad_info.errors.length, 3);

});


module('Test LayerInfo on a CSV file');
test('Test LayerInfo object on an valid CSV file', function () {
    var csv_info = new up.LayerInfo('test-csv', ['test.csv']);

    ok(csv_info instanceof up.LayerInfo, 'The constructor should return the correct type');
    strictEqual(csv_info.type, up.csv, 'Make sure that a csv is correctly identified');
    deepEqual(csv_info.errors.length, 0, 'There should be no errors');
    strictEqual(csv_info.main, 'test.csv', 'This should be the main file');
    ok(csv_info.prepare_form_data(), 'Make that we can generate a form data object');

});

module('Test the LayerInfo object on a tiff file');
test('Test the LayerInfo object on a valid tiff file', function () {
    var tif_info = new up.LayerInfo('test-tif', ['test.tif']);
    ok(tif_info instanceof up.LayerInfo, 'Make sure the constructor returns the correct type');
    strictEqual(tif_info.type, up.tif, 'Make sure the type returned is correct');
    deepEqual(tif_info.errors.length, 0);

});


module('Test the LayerInfo object on a zip file');
test('Test the LayerInfo object on a valid zip file', function () {
    var zip_info = new up.LayerInfo('test-zip', ['test.zip']);

    ok(zip_info instanceof up.LayerInfo, 'Make sure the constructor returns the correct type');
    strictEqual(zip_info.type, up.zip);
    deepEqual(zip_info.errors.length, 0);

    ok(zip_info.prepare_form_data() instanceof FormData);

});