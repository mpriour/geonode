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
            {name: 'A4', size: [210, 297], units: 'mm'},
            {name: 'letter', size: [8.5, 11], units: 'in'},
            {name: 'ledger', size: [11, 17], units: 'in'},
            {name: 'A5', size: [148, 210], units: 'mm'},
            {name: 'A3', size: [297, 420], units: 'mm'},
            {name: 'B5', size: [176, 250], units: 'mm'},
            {name: 'B4', size: [250, 353], units: 'mm'},
            {name: 'legal', size: [8.5, 14], units: 'in'}
        ];
        var defDpiArray = [
            [75, '75 dpi'],
            [150, '150 dpi'],
            [300, '300 dpi']
        ];
        var paperArray = config.paperSizes || defPaperArray;
        config.dpis = config.dpis || defDpiArray;
        delete config.paperSizes;
        this.paperSizes = new Ext.data.JsonStore({
            data: paperArray,
            fields: ['name', 'size', 'units'],
            idProperty: 'name'
        });
        GeoExplorer.GeonodePrintPanel.superclass.constructor.call(this, config);
    },
    initComponent: function() {
        var optionsToolbarConfig = {
            xtype: 'toolbar',
            ref: 'printOptions',
            items: [{
                xtype: 'container',
                layout: 'table',
                layoutConfig: {
                    columns: 2
                },
                frame: false,
                defaults: {
                    xtype: 'combo',
                    forceSelection: true,
                    lazyInit: false,
                    selectOnFocus: true,
                    triggerAction: 'all',
                    mode: 'local',
                    bodyStyle: 'padding: 2px 15px;'
                },
                items: [{
                    xtype: 'label',
                    text: this.paperSizeText
                }, {
                    ref: '../pageSizeSelect',
                    width: 120,
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
                }, {
                    xtype: 'label',
                    text: this.printTemplateText
                }, {
                    ref: '../templateSelect',
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
                }]
            }, {
                xtype: 'spacer',
                width: 20
            }, {
                xtype: 'container',
                layout: 'table',
                layoutConfig: {
                    columns: 2
                },
                frame: false,
                defaults: {
                    xtype: 'combo',
                    forceSelection: true,
                    lazyInit: false,
                    selectOnFocus: true,
                    triggerAction: 'all',
                    mode: 'local',
                    bodyStyle: 'padding: 2px 15px;'
                },
                items: [{
                    xtype: 'label',
                    text: this.resolutionText
                }, {
                    ref: '../resolutionSelect',
                    width: 120,
                    store: this.dpis,
                    value: this.dpis[1] && this.dpis[1].length && this.dpis[1][0],
                    listeners: {
                        'select': this.onTemplateSelect,
                        scope: this
                    }
                }, {
                    xtype: 'label',
                    text: 'Include Legend?'
                }, {
                    xtype: 'checkbox',
                    ref: '../legendCheckbox',
                    checked: false
                }]
            }, '->',
            {
                xtype: 'buttongroup',
                width: 120,
                frame: false,
                items: [{
                    xtype: 'buttongroup',
                    columns: 2,
                    title: 'Orientation',
                    defaults: {
                        scale: 'large',
                        width: 60,
                        iconAlign: 'top',
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
                    }, {
                        text: 'Landscape',
                        iconCls: 'gxp-icon-orient-landscape',
                        value: 'landscape',
                        pressed: true
                    }]
                }, {
                    xtype: 'button',
                    width: 120,
                    iconAlign: 'right',
                    scale: 'large',
                    text: this.printText,
                    iconCls: "gxp-icon-print",
                    handler: function() {
                        if(this.lastPrintLink) {
                            this.printProvider.download(null, this.lastPrintLink);
                        } else {
                            Ext.Msg.alert('Error', 'Please select a template first').setIcon(Ext.MessageBox.ERROR);
                        }
                    },
                    scope: this
                }]
            }]
        };
        var previewPanelConfig = {
            xtype: 'box',
            disabled: true,
            anchor: '100%, 100%',
            tpl: '<iframe style="width:100%;height:100%" src={url}></iframe>',
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

    onTemplateSelect: function(cmp, rec, index) {
        this.printProvider.setOptions({
            activeTemplate: rec
        });
        this.getPreview();
    },
    onPageSizeSelect: function(cmp, rec, index) {
        this.printProvider.setOptions({
            pageSize: cmp.getValue(),
            pageUnits: rec.get('units')
        });
        this.getPreview();
    },
    onOrientationChange: function(cmp, checked) {
        this.printProvider.setOptions({
            pageOrientation: cmp.value
        });
        this.getPreview();
    },
    onPageComboRender: function(cmp) {
        if(this.printProvider) {
            var size = this.printProvider.pageSize;
            var ndx = this.paperSizes.find('name', size);
            var paperSelect = this.printOptions.pageSizeSelect;
            if(ndx > -1) {
                paperSelect.expand();
                paperSelect.setValue(paperSelect.store.getAt(ndx)[paperSelect.valueField]);
            }
        }
    },
    readyToPrint: function() {
        var ready = false;
        var frm = this.printOptions,
            fields = [frm.pageSizeSelect, frm.templateSelect];
        Ext.each(fields, function(cmp) {
            ready = cmp.selectedIndex > -1 && cmp.getValue() != cmp.emptyText;
            return ready;
        });
        return ready;
    },
    getPreview: function() {
        if(this.readyToPrint()) {
            this.printPreview.enable();
            if(!this.busyMask) {
                this.busyMask = new Ext.LoadMask(this.printPreview.getEl(), {
                    msg: this.creatingPdfText
                });
            }
            this.busyMask.show();
            var boundPreview = this.showPreview.createDelegate(this);
            Ext.getBody(false).appendChild(Ext.DomHelper.createDom({
                tag: 'div',
                id: 'printMap',
                style: 'position:absolute; right: 5000px; top: 0px;'
            }));
            var map = this.createPrinterMap(this.printProvider.print.createDelegate(
                this.printProvider,
                [Ext.get('printMap'),{callback: boundPreview, mapId: this.mapId}],
                false
            ));
        }
    },
    sendToPrint: function() {
        if(this.readyToPrint()) {
            this.printProvider.print(
            {
                map: this.createPrinterMap()
            },{
                mapId: this.mapId
            });
        }
    },
    showPreview: function(resp, url) {
        this.busyMask.hide();
        this.printPreview.update({
            'url': url
        });
        this.lastPrintLink = url;
        Ext.removeNode(Ext.getDom('printMap'));
    },
    createPrinterMap: function(callback) {
        var olmap = this.map.map;
        var opts = this.printOptions;
        var that = this;
        var dpi = opts.resolutionSelect.getValue();
        var paperDim = opts.pageSizeSelect.getValue();
        var paperRec = opts.pageSizeSelect.findRecord(opts.pageSizeSelect.valueField, paperDim);
        var paperUnits = paperRec.get('units');
        //convert paperDim to printer map dimension array
        var cfact = OpenLayers.INCHES_PER_UNIT[paperUnits] * dpi;
        var pmapDim = [parseInt(paperDim[0] * cfact), parseInt(paperDim[1] * cfact)];
        if(this.printProvider.pageOrientation == 'landscape') {
            pmapDim = pmapDim.reverse();
        }
        //get and preserve the original map center & zoom
        var origCZ = {
            center: olmap.getCenter(),
            zoom: olmap.zoom
        };
        //create a correctly sized map clone
        var pmapDiv = Ext.get('printMap');
        pmapDiv.setSize(pmapDim[0], pmapDim[1]);
        var mapConfig = Ext.apply(olmap.options, {
            div: 'printMap',
            center: undefined,
            zoom: undefined,
            layers: []
        });
        Ext.each(olmap.layers, function(lyr) {
            lyr_clone = lyr.clone();
            lyr_clone.events.on({
                'loadstart': function(evt){
                    var map = evt.object.map;
                    map.layerQueue = map.layerQueue ? ++map.layerQueue : 1;
                },
                'loadend': function(evt){
                    var map = evt.object.map;
                    if(--map.layerQueue === 0){
                        callback.apply(that, [map]);
                    }
                },
                scope: this
            });
            mapConfig.layers.push(lyr_clone);
        });
        var pmap = new OpenLayers.Map(mapConfig);
        pmap.setCenter(origCZ.center, origCZ.zoom);
        return pmap;
    }
});

/** api: xtype = gn_printpanel */
Ext.reg('gn_printpanel', GeoExplorer.GeonodePrintPanel);
