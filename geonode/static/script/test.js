


module('main tests', {
    setup: function () {
        setup({});
    },
});

test('test split the file name', function () {
    equal(get_ext({name: 'hello.shp'}), 'shp');
    equal(get_name({name: 'hello.shp'}), 'hello');
});

test('test creating a filetype object', function() {
    var blah = new FileType('Blah type', 'blah', ['blah', 'more-blah']);
    equal(blah.name, 'Blah type');
    ok(blah.is_type({name:'file.blah'}));

    // locate a shapefile
    var esri = find_file_type({'name': 'hello.shp'});
    equal(typeof esri, "object");
    
    var blah_type = find_file_type({'name': 'hello.blah'});
    equal(typeof blah_type, 'undefined');

    // make sure we have enough types
    equal(types.length, 3);
    // add our blah type
    types.push(blah);
    equal(types.length, 4);
    
});