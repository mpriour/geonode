/**
 * @requires GeoExplorer/GeonodePrintProvider.js
 */
Ext.namespace("GeoExplorer");
GeoExplorer.GeonodePrintPanel = Ext.extend(Ext.Panel, {

    printProvider: null,

    paperSizes: null,

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
            fields: ['name', 'size', 'units']
        });
        config.listeners = Ext.apply(config.listeners || {}, {
            'render': this.onRender,
            scope: this
        });
        GeoExplorer.GeonodePrintPanel.superclass.constructor.call(this,config);
    },
    initComponent: function() {
        var optionsPanelConfig = {
            xtype: 'form',
            layout: 'form',
            ref: '../printOptions',
            flex: 1,
            items: [{
                xtype: 'combo',
                ref: '../paperSizeSelect',
                store: this.paperSizes,
                name: 'paperSize',
                valueField: 'size',
                displayField: 'name',
                forceSelection: true,
                fieldLabel: 'Page Size',
                emptyText: 'Page Sizes',
                lazyInit: true,
                listEmptyText: 'Page Sizes',
                selectOnFocus: true,
                triggerAction: 'all',
                mode: 'local',
                listeners: {
                    'select': this.onPageSizeSelect,
                    scope: this
                }
            }, {
                xtype: 'combo',
                ref: '../templateSelect',
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
                xtype: 'radiogroup',
                fieldLabel: 'Orientation',
                defaults:{
                    handler: this.onOrientationChange,
                    scope: this
                },
                items: [{
                    xtype: 'radio',
                    boxLabel: 'Portrait',
                    name: 'orientation',
                    inputValue: 'portait',
                    checked: true
                }, {
                    xtype: 'radio',
                    boxLabel: 'Landscape',
                    name: 'orientation',
                    inputValue: 'landscape',
                    checked: false
                }]
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
            //height: 'auto',
            flex: 3
        };

        Ext.apply(this, {
            items: [optionsPanelConfig,previewPanelConfig]
        });
        
        GeoExplorer.GeonodePrintPanel.superclass.initComponent.apply(this,arguments);
    },

    onTemplateSelect: Ext.emptyFn,
    onPageSizeSelect: Ext.emptyFn,
    onOrientationChange: Ext.emptyFn,
    onRender: function(cmp){
        if(this.printProvider){
            var size = this.printProvider.pageSize;
            var ndx = this.paperSizes.find('name', size);
            if(ndx>-1){
                this.printOptions.pageSizeSelect.setValue(store.getAt(ndx).id);
            }
        }
    }
});

/** api: xtype = gn_printpanel */
Ext.reg('gn_printpanel', GeoExplorer.GeonodePrintPanel);
