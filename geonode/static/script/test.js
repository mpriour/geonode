/*global UPLOAD:true, test:true, ok:true, equal:true, deepEqual:true, FormData:true */
'use strict';
var up = UPLOAD;

test('Test the FileType object', function () {
    var type = new up.FileType('Test Type', 'test', ['req']);

    ok(type instanceof up.FileType, 'Does new return the correct object');
    equal(type.main, 'test', 'Is the main type correct');
    equal(type.name, 'Test Type', 'Is the name correct');
    ok(type.is_type('file.test'), 'Can the type identify its own type');

    deepEqual(type.find_type_errors(['req']), [], 'Can the type check errors correctly');
});


test('Test LayerInfo object', function () {
    var info = new up.LayerInfo('nybb', ['nybb.shp', 'nybb.dbf']),
        form_data = info.prepare_form_data();

    ok(info instanceof up.LayerInfo);
    // our test file is an shapefile
    equal(info.type, up.types[0]);

    deepEqual(info.get_extensions(), ['shp', 'dbf']);

    ok(form_data instanceof FormData);

});