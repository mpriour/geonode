/**
 * @requires GeoExplorer/GeonodePrintProvider.js
 */
Ext.namespace("GeoExplorer");
GeoExplorer.GeonodePrintPanel = Ext.extend(Ext.Panel, {

    printProvider: null,

    paperSizes: null,

    map: null,

    constructor: function(config) {
        config = config || {};
        var defPaperArray = [
            {name: 'A5', size: [148, 210], units: 'mm'},
            {name: 'A4', size: [210, 297], units: 'mm'},
            {name: 'A3', size: [297, 420], units: 'mm'},
            {name: 'B5', size: [176, 250], units: 'mm'},
            {name: 'B4', size: [250, 353], units: 'mm'},
            {name: 'letter', size: [8.5, 11], units: 'in'},
            {name: 'legal', size: [8.5, 14], units: 'in'},
            {name: 'ledger', size: [11, 17], units: 'in'}
        ];
        var paperArray = config.paperSizes || defPaperArray;
        delete config.paperSizes;
        this.paperSizes = new Ext.data.JsonStore({
            data: paperArray,
            fields: ['name', 'size', 'units'],
            idProperty: 'name'
        });
        GeoExplorer.GeonodePrintPanel.superclass.constructor.call(this,config);
    },
    initComponent: function() {
        var optionsPanelConfig = {
            xtype: 'form',
            layout: 'form',
            ref: 'printOptions',
            flex: 1,
            height: 360,
            items: [{
                xtype: 'combo',
                ref: 'pageSizeSelect',
                store: this.paperSizes,
                name: 'pageSize',
                valueField: 'size',
                displayField: 'name',
                forceSelection: true,
                fieldLabel: 'Page Size',
                emptyText: 'Page Sizes',
                lazyInit: false,
                listEmptyText: 'Page Sizes',
                selectOnFocus: true,
                triggerAction: 'all',
                mode: 'local',
                listeners: {
                    'select': this.onPageSizeSelect,
                    'render': this.onPageComboRender,
                    scope: this
                }
            }, {
                xtype: 'combo',
                ref: 'templateSelect',
                store: this.printProvider.templates,
                name: 'template',
                valueField: 'id',
                displayField: 'title',
                forceSelection: true,
                fieldLabel: 'Template',
                emptyText: 'Select a Template',
                lazyInit: true,
                listEmptyText: 'Select a Template',
                selectOnFocus: true,
                triggerAction: 'all',
                listeners: {
                    'select': this.onTemplateSelect,
                    scope: this
                }
            }, {
                xtype: 'radio',
                boxLabel: 'Portrait',
                name: 'orientation',
                inputValue: 'portait',
                checked: true,
                handler: this.onOrientationChange,
                scope: this
            }, {
                xtype: 'radio',
                boxLabel: 'Landscape',
                name: 'orientation',
                inputValue: 'landscape',
                checked: false,
                handler: this.onOrientationChange,
                scope: this
            }, {
                xtype: 'checkbox',
                boxLabel: 'Include Legend',
                name: 'legend',
                checked: false
            }]
        };
        var previewPanelConfig = {
            xtype: 'box',
            html: '<iframe id="printpreviewframe" src=""></iframe>',
            anchor: '100%, 100%',
            //autoWidth: true,
            height: Math.min(420, Ext.get(document.body).getHeight() - 150),
            //height: 'auto',
            flex: 3,
            ref: 'printPreview'
        };

        Ext.apply(this, {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start'
            },
            items: [optionsPanelConfig, previewPanelConfig]
        });

        GeoExplorer.GeonodePrintPanel.superclass.initComponent.apply(this, arguments);
    },

    onTemplateSelect: function(cmp, rec, index){
        this.printProvider.setOptions({
            activeTemplate: rec
        });
        this.getPreview();
    },
    onPageSizeSelect: function(cmp, rec, index){
        this.printProvider.setOptions({
            pageSize: cmp.getValue(),
            pageUnits: rec.get('units')
        });
        this.getPreview();
    },
    onOrientationChange: function(cmp, checked){
        this.printProvider.setOptions({
            pageOrientation: cmp.getValue()
        });
        this.getPreview();
    },
    onPageComboRender: function(cmp){
        if(this.printProvider){
            var size = this.printProvider.pageSize;
            var ndx = this.paperSizes.find('name', size);
            var paperSelect = this.printOptions.pageSizeSelect;
            if(ndx>-1){
                paperSelect.expand();
                paperSelect.setValue(paperSelect.store.getAt(ndx)[paperSelect.valueField]);
            }
        }
    },
    readyToPrint: function(){
        var ready = false;
        var frm = this.printOptions, fields = [frm.pageSizeSelect, frm.templateSelect];
        Ext.each(fields, function(cmp){
            ready = cmp.selectedIndex > -1 && cmp.getValue() != cmp.emptyText;
            return ready;
        });
        return ready;
    },
    getPreview: function(){
        if(this.readyToPrint()){
            this.printProvider.print(this.map, {
                callback: this.showPreview.createDelegate(this),
                mapId: this.mapId
            });
        }
    },
    sendToPrint: function(){
        if(this.readyToPrint()){
            this.printProvider.print(this.map, {
                mapId: this.mapId
            });
        }
    },
    showPreview: function(resp, url){
        this.printPreview.getEl().down('iframe').dom.setAttribute('src', url);
    }
});

/** api: xtype = gn_printpanel */
Ext.reg('gn_printpanel', GeoExplorer.GeonodePrintPanel);
