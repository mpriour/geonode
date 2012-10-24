/**
 * Copyright (c) 2012-2012 OpenGeo
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires GeoExplorer/GeonodePrintProvider.js
 * @requires GeoExplorer/PrintPanel.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = GeoExplorer.PrintPanel
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("GeoExplorer");

/** api: constructor
 *  .. class:: PrintPlugin(config)
 *
 *    Provides an action to print the map
 */
GeoExplorer.PrintPlugin = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gn_print */
    ptype: "gn_print",

    /** api: config[printService]
     *  ``String``
     *  URL of the GeoNode print service.
     *  Defaults to '/printing/print/'
     */
    printService: '/printing/print/',

    /** api: config[templateService]
     *  ``String``
     *  URL of the GeoNode print template source.
     *  Do NOT include a trailing slash
     *  Defaults to 'printing/templates'
     */
    templateService: '/printing/templates',

    /** api: config[previewService]
     *  ``String``
     *  URL of the GeoNode print preview service.
     *  Defaults to 'printing/preview/'
     */
    previewService: '/printing/preview/',

    /** api: config[includeLegend]
     *  ``Boolean`` Should we include the legend in the print by default? Defaults to true.
     */
    includeLegend: true,

    /** api: config[menuText]
     *  ``String``
     *  Text for print menu item (i18n).
     */
    menuText: "Print Map",

    /** api: config[tooltip]
     *  ``String``
     *  Text for print action tooltip (i18n).
     */
    tooltip: "Print Map",

    /** api: config[text]
     *  ``String``
     *  Text for print action button (i18n).
     */
    buttonText: "Print",

    /** api: config[notAllNotPrintableText]
     *  ``String``
     *  Text for message when not all layers can be printed (i18n).
     */
    notAllNotPrintableText: "Not All Layers Can Be Printed",

    /** api: config[nonePrintableText]
     *  ``String``
     *  Text for message no layers are suitable for printing (i18n).
     */
    nonePrintableText: "None of your current map layers can be printed",

    /** api: config[previewText]
     *  ``String``
     *  Text for print preview text (i18n).
     */
    previewText: "Print Preview",

    /** private: method[constructor]
     */
    constructor: function(config) {
        GeoExplorer.PrintPlugin.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        // don't add any action if there is no print service configured
        if (this.printService !== null) {
            var provider = new GeoExplorer.GeonodePrintProvider({
                printService: this.printService,
                templateService: this.templateService,
                previewService: this.previewService
            });
            var actions = GeoExplorer.PrintPlugin.superclass.addActions.call(this, [{
                menuText: this.menuText,
                buttonText: this.buttonText,
                tooltip: this.tooltip,
                iconCls: "gxp-icon-print",
                handler: function() {
                    provider.print(this.target.mapPanel, {
                        mapId: this.target.mapID
                    });
                },
                scope: this
            }]);

            var printButton = actions[0].items[0];

            var printWindow;


            function sendPrint(){

            }

            function destroyPrintComponents() {
                if (printWindow) {
                    // TODO: fix this in GeoExt
                    try {
                        var panel = printWindow.items.first();
                        panel.printMapPanel.printPage.destroy();
                        //panel.printMapPanel.destroy();
                    } catch (err) {
                        // TODO: improve destroy
                    }
                    printWindow = null;
                }
            }

            var mapPanel = this.target.mapPanel;

            function createPrintWindow() {
                var legend = null;
                if (this.includeLegend === true) {
                    var key, tool;
                    for (key in this.target.tools) {
                        tool = this.target.tools[key];
                        if (tool.ptype === "gxp_legend") {
                            legend = tool.getLegendPanel();
                            break;
                        }
                    }
                    // if not found, look for a layer manager instead
                    if (legend === null) {
                        for (key in this.target.tools) {
                            tool = this.target.tools[key];
                            if (tool.ptype === "gxp_layermanager") {
                                legend = tool;
                                break;
                            }
                        }
                    }
                }
                printWindow = new Ext.Window({
                    title: this.previewText,
                    modal: true,
                    border: false,
                    autoHeight: true,
//                    resizable: false,
                    width: 360,
                    items: [
                        new GeoExplorer.PrintPanel({
                            minWidth: 336,
                            mapTitle: this.target.about && this.target.about["title"],
                            comment: this.target.about && this.target.about["abstract"],
                            printMapPanel: {
                                autoWidth: true,
                                height: Math.min(420, Ext.get(document.body).getHeight()-150),
                                limitScales: true,
                                map: Ext.applyIf({
                                    controls: [
                                        new OpenLayers.Control.Navigation({
                                            zoomWheelEnabled: false,
                                            zoomBoxEnabled: false
                                        }),
                                        new OpenLayers.Control.PanPanel(),
                                        new OpenLayers.Control.ZoomPanel(),
                                        new OpenLayers.Control.Attribution()
                                    ],
                                    eventListeners: {
                                        preaddlayer: function(evt) {
                                            return isPrintable(evt.layer);
                                        }
                                    }
                                }, mapPanel.initialConfig.map),
                                items: [{
                                    xtype: "gx_zoomslider",
                                    vertical: true,
                                    height: 100,
                                    aggressive: true
                                }],
                                listeners: {
                                    afterlayout: function(evt) {
                                        printWindow.setWidth(Math.max(360, this.getWidth() + 24));
                                        printWindow.center();
                                    }
                                }
                            },
                            printProvider: printProvider,
                            includeLegend: this.includeLegend,
                            legend: legend,
                            sourceMap: mapPanel
                        })
                    ],
                    listeners: {
                        beforedestroy: destroyPrintComponents
                    }
                });
                return printWindow;
            }

            function showPrintWindow() {
                printWindow.show();

                // measure the window content width by it's toolbar
                printWindow.setWidth(0);
                var tb = printWindow.items.get(0).items.get(0);
                var w = 0;
                tb.items.each(function(item) {
                    if(item.getEl()) {
                        w += item.getWidth();
                    }
                });
                printWindow.setWidth(
                    Math.max(printWindow.items.get(0).printMapPanel.getWidth(),
                    w + 20)
                );
                printWindow.center();
            }

            return actions;
        }
    }

});

Ext.preg(GeoExplorer.PrintPlugin.prototype.ptype, GeoExplorer.PrintPlugin);    

