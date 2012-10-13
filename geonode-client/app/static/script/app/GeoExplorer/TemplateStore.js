Ext.namespace("GeoExplorer");

GeoExplorer.TemplateStore = Ext.extend(Ext.data.JsonStore, {
    url: 'printing/templates',
    storeId: 'printTemplates',
    idProperty: 'pk',
    fields: [
        {name: 'title', mapping: 'fields.title'},
        {name: 'contents', mapping: 'fields.contents'},
        {name: 'url', mapping: 'fields.url'}
    ]
});
