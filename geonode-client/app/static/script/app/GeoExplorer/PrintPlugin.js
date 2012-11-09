/**
 * Copyright (c) 2012-2012 OpenGeo
 *
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires GeoExplorer/GeonodePrintProvider.js
 * @requires GeoExplorer/GeonodePrintPanel.js
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

    printProvider: null,

    /** api: method[addActions]
     */
    addActions: function() {
        // don't add any action if there is no print service configured
        if(this.printService !== null) {
            var provider = new GeoExplorer.GeonodePrintProvider(Ext.apply({
                printService: this.printService,
                templateService: this.templateService,
                previewService: this.previewService
            }, this.initialConfig.controlConfig));
            this.printProvider = provider;
            var actions = [{
                menuText: this.menuText,
                buttonText: this.buttonText,
                tooltip: this.tooltip,
                iconCls: "gxp-icon-print",
                scope: this
            }];
            this.outputAction = 0;
            GeoExplorer.PrintPlugin.superclass.addActions.call(this, actions);
        }

    },
    addOutput: function(config) {
        config = Ext.applyIf(config || {}, {
            layout: 'vbox',
            layoutConfig:{
                align: 'stretch'
            },
            width: 400,
            height: 600,
            ref: 'map'
        });
        this.outputConfig = this.outputConfig ? Ext.apply(this.outputConfig, config) : config;
        GeoExplorer.PrintPlugin.superclass.addOutput.apply(this, [Ext.apply(config, {
            xtype: 'gn_printpanel',
            printProvider: this.printProvider
        })]);
    }
});

Ext.preg(GeoExplorer.PrintPlugin.prototype.ptype, GeoExplorer.PrintPlugin);
