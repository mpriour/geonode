/**
 * @requires GeoExplorer/GeonodePrintProvider.js
 */
Ext.namespace("GeoExplorer");
GeoExplorer.GeonodePrintPanel = Ext.extend(Ext.Panel, {

    /* begin i18n */
    /** api: config[paperSizeText] ``String`` i18n */
    paperSizeText: "Paper size:",
    /** api: config[paperSizeText] ``String`` i18n */
    printTemplateText: "Template:",
    /** api: config[resolutionText] ``String`` i18n */
    resolutionText: "Resolution:",
    /** api: config[paperSizeText] ``String`` i18n */
    emptyPaperListText: "Paper Sizes",
    /** api: config[paperSizeText] ``String`` i18n */
    emptyTemplateListText: "Select a Template",
    /** api: config[printText] ``String`` i18n */
    printText: "Print",
    /** api: config[emptyTitleText] ``String`` i18n */
    emptyTitleText: "Enter map title here.",
    /** api: config[includeLegendText] ``String`` i18n */
    includeLegendText: "Include legend?",
    /** api: config[emptyCommentText] ``String`` i18n */
    emptyCommentText: "Enter comments here.",
    /** api: config[creatingPdfText] ``String`` i18n */
    creatingPdfText: "Creating PDF...",
    /* end i18n */

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
        var defDpiArray = [[75, '75 dpi'],[150, '150 dpi'],[300, '300 dpi']];
        var paperArray = config.paperSizes || defPaperArray;
        config.dpis = config.dpis || defDpiArray;
        delete config.paperSizes;
        this.paperSizes = new Ext.data.JsonStore({
            data: paperArray,
            fields: ['name', 'size', 'units'],
            idProperty: 'name'
        });
        GeoExplorer.GeonodePrintPanel.superclass.constructor.call(this,config);
    },
    initComponent: function() {
        var optionsToolbarConfig = {
            xtype: 'toolbar',
            ref: 'printOptions',
            defaults: {
                xtype: 'combo',
                forceSelection: true,
                lazyInit: false,
                selectOnFocus: true,
                triggerAction: 'all',
                mode: 'local'
            },
            items: [this.paperSizeText,{
                ref: 'pageSizeSelect',
                width: 100,
                store: this.paperSizes,
                valueField: 'size',
                displayField: 'name',
                emptyText: this.emptyPaperListText,
                listEmptyText: this.emptyPaperListText,
                listeners: {
                    'select': this.onPageSizeSelect,
                    'render': this.onPageComboRender,
                    scope: this
                }
            }, this.printTemplateText, {
                ref: 'templateSelect',
                width: 120,
                store: this.printProvider.templates,
                valueField: 'id',
                displayField: 'title',
                emptyText: this.emptyTemplateListText,
                lazyInit: true,
                listEmptyText: this.emptyTemplateListText,
                listeners: {
                    'select': this.onTemplateSelect,
                    scope: this
                }
            }, this.resolutionText, {
                ref: 'resolutionSelect',
                width: 90,
                store: this.dpis,
                value: this.dpis[1] && this.dpis[1].length && this.dpis[1][0],
                listeners: {
                    'select': this.onTemplateSelect,
                    scope: this
                }
            }, {
                xtype: 'buttongroup',
                text: 'Orientation',
                defaults: {
                    scale: 'large',
                    width: 60,
                    iconAlign:'top',
                    allowDepress: true,
                    enableToggle: true,
                    toggleGroup: 'orientation',
                    handler: this.onOrientationChange,
                    scope: this
                },
                items: [{
                    text: 'Portrait',
                    iconCls: 'gxp-icon-orient-portrait',
                    value: 'portrait'
                },{
                    text: 'Landscape',
                    iconCls: 'gxp-icon-orient-landscape',
                    value: 'landscape',
                    pressed: true
                }]
                
            }, {
                xtype: 'checkbox',
                boxLabel: 'Include Legend',
                checked: false
            },'->',{
                xtype: 'button',
                scale: 'large',
                text: this.printText,
                iconCls: "gxp-icon-print",
                handler: function(){
                    if(this.lastPrintLink){
                        this.printProvider.download(null, this.lastPrintLink);
                    } else {
                        Ext.Msg.alert('Error', 'Please select a template first').setIcon(Ext.MessageBox.ERROR);
                    }
                },
                scope: this
            }]
        };
        var previewPanelConfig = {
            xtype: 'box',
            anchor: '100%, 100%',
            //autoWidth: true,
            height: Math.min(420, Ext.get(document.body).getHeight() - 150),
            tpl: '<iframe style="width:100%;height:100%" src={url}></iframe>',
            //height: 'auto',
            //flex: 3,
            ref: 'printPreview'
        };

        Ext.apply(this, {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start'
            },
            items: [optionsToolbarConfig, previewPanelConfig]
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
            pageOrientation: cmp.value
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
        this.printPreview.update({'url': url});
        this.lastPrintLink = url;
    }
});

/** api: xtype = gn_printpanel */
Ext.reg('gn_printpanel', GeoExplorer.GeonodePrintPanel);
