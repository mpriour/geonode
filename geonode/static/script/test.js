/*global UPLOAD:true, test:true, ok:true, equal:true, deepEqual:true, FormData:true */
'use strict';
var up = UPLOAD;

test('FileType', function () {
    var type = new up.FileType('Test Type', 'test', ['req']);

    ok(type instanceof up.FileType, 'Does new return the correct object');
    equal(type.main, 'test', 'Is the main type correct');
    equal(type.name, 'Test Type');
    ok(type.is_type({name: 'file.test'}), 'Can the type identify its own type');
    // equal(type.find_type_errors(['req']), []);
});


test('Test LayerInfo object', function () {
    var info = new up.LayerInfo('nybb', [{name: 'nybb.shp'}]),
        form_data = info.prepare_form_data();

    ok(info instanceof up.LayerInfo);
    // our test file is an shapefile
    equal(info.type, up.types[0]);

    deepEqual(info.get_extensions(), ["shp"]);

    ok(form_data instanceof FormData);

});