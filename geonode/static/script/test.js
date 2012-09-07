'use strict';

describe('main test module', function () {

    it('split the file name', function () {

        expect(get_ext({name: 'hello.shp'})).to.eql('shp');
        expect(get_name({name: 'hello.shp'})).to.eql('hello');

    });

    it('creating a filetype object', function () {
        var blah = new FileType('Blah type', 'blah', ['blah', 'more-blah']),
            esri = find_file_type({'name': 'hello.shp'}),
            blah_type = find_file_type({'name': 'hello.blah'});

        expect(blah.name).to.eql('Blah type');
        // Double check that we can correctly identify a file type


        expect(esri).to.be.an('object');
        expect(blah_type).to.be.an('undefined');

        // make sure we have enough types
        expect(types).to.have.length(3);
        // add our blah type
        types.push(blah);
        expect(types).to.have.length(4);

    });

    it('layerinfo object', function () {
        var info = new LayerInfo('describe', null, [], [{name: 'blah.shp'}]);

    });

});