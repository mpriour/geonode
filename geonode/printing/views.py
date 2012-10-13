import urllib2
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template import RequestContext, loader, Template
from django.core import serializers
from geonode.maps.models import Map
from geonode.layers.models import Layer
from geonode.printing.models import PrintTemplate
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def printing_print_map(request, templateid, mapid=None):
    resource_context = get_resource_context(mapid=mapid)
    return printing_print(request, templateid, resource_context)


@csrf_exempt
def printing_print_layer(request, templateid, layerid=None):
    resource_context = get_resource_context(layerid=layerid)
    return printing_print(request, templateid, resource_context)


@csrf_exempt
def printing_preview_map(request, templateid, mapid=None):
    resource_context = get_resource_context(mapid=mapid)
    return printing_preview(request, templateid, resource_context)


@csrf_exempt
def printing_preview_layer(request, templateid, layerid=None):
    resource_context = get_resource_context(layerid=layerid)
    return printing_preview(request, templateid, resource_context)


def printing_print(request, templateid, resource_context):
    """interpolate the template with the given id"""
    template = get_template(templateid)
    rendered = render_template(request, template, resource_context)
    try:
        printed = urllib2.urlopen(settings.GEOSERVER_PRINT_URL + "pdf", rendered)
    except Exception, e:
        return HttpResponse(
            e.message,
            mimetype="text/plain",
            status=e.code or 500
        )
    return HttpResponse(printed, content_type="application/pdf")


def printing_preview(request, templateid, resource_context):
    """interpolate the template with the given id"""
    template = get_template(templateid)
    rendered = render_template(request, template, resource_context)
    try:
        printed = urllib2.urlopen(settings.GEOSERVER_PRINT_URL + "png", rendered)
    except Exception, e:
        return HttpResponse(
            e.message,
            mimetype="text/plain",
            status=e.code or 500
        )
    return HttpResponse(printed, content_type="image/png")


def get_resource_context(mapid=None, layerid=None):
    if mapid is not None:
        resource_obj = get_object_or_404(Map, pk=mapid)
    else:
        resource_obj = get_object_or_404(Layer, typename=layerid)
    resource_map = (mapid is not None) and {"map": resource_obj} or {"layer": resource_obj}
    return resource_map


def get_template(templateid):
    template_obj = get_object_or_404(PrintTemplate, pk=templateid)

    if template_obj.contents:
        template = Template(template_obj.contents)
    else:
        try:
            if not template_obj.url.find("http", 0, 4) > -1:
                template = loader.get_template(template_obj.url)
            else:
                remote_template = urllib2.urlopen(template_obj.url)
                template = Template(remote_template.readlines())
        except Exception, e:
            return HttpResponse(
                "Error reading or parsing remote template at %s" % template_obj.url,
                mimetype="text/plain",
                status=500
            )
    return template


def render_template(request, template, resource_context):
    context = RequestContext(request, resource_context)
    try:
        rendered = template.render(context)
    except Exception, e:
        return HttpResponse(
            "Error rendering template",
            mimetype="text/plain",
            status=500
        )
    return rendered


#require_GET()
def printing_template_list(request):
    """list the available templates"""
    templates = PrintTemplate.objects.all()
    return HttpResponse(
        serializers.serialize("json", templates),
        mimetype="application/json"
    )
