import urllib2
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template import Context, loader, Template
from django.core import serializers
from django.forms.models import model_to_dict
from geonode.maps.models import Map
from geonode.layers.models import Layer
from geonode.printing.models import PrintTemplate
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def printing_print_map(request, templateid, mapid=None):
    resource_context = get_resource_context(mapid=mapid)
    return printing_print(request, templateid, resource_context, 'pdf')


@csrf_exempt
def printing_print_layer(request, templateid, layerid=None):
    resource_context = get_resource_context(layerid=layerid)
    return printing_print(request, templateid, resource_context, 'pdf')


@csrf_exempt
def printing_preview_map(request, templateid, mapid=None):
    resource_context = get_resource_context(mapid=mapid)
    return printing_print(request, templateid, resource_context, 'png')


@csrf_exempt
def printing_preview_layer(request, templateid, layerid=None):
    resource_context = get_resource_context(layerid=layerid)
    return printing_print(request, templateid, resource_context, 'png')


def printing_print(request, templateid, resource_context, format):
    """interpolate the template with the given id"""
    try:
        template = get_template(templateid)
        rendered = render_template(request, template, resource_context)
        printed = urllib2.urlopen(settings.GEOSERVER_PRINT_URL + "json?format=" + format, rendered)
    except Exception, e:
        return HttpResponse(
            e.message,
            mimetype="text/plain",
            status=500
        )
    return HttpResponse(printed, content_type="application/json")


def get_resource_context(mapid=None, layerid=None):
    if mapid is not None:
        resource_obj = get_object_or_404(Map, pk=mapid)
    else:
        resource_obj = get_object_or_404(Layer, typename=layerid)
    return resource_obj


def get_template(templateid):
    template_obj = get_object_or_404(PrintTemplate, pk=templateid)
    if template_obj.contents:
        template = Template(template_obj.contents)
    else:
        if not template_obj.url.find("http", 0, 4) > -1:
            template = loader.get_template(template_obj.url)
        else:
            remote_template = urllib2.urlopen(template_obj.url)
            template = Template(remote_template.readlines())
    return template


def render_template(request, template, resource_context):
    render_data = request.POST.copy()
    render_data.update(model_to_dict(resource_context))
    context = Context(render_data)
    rendered = template.render(context)
    return rendered


#require_GET()
def printing_template_list(request):
    """list the available templates"""
    templates = PrintTemplate.objects.all()
    return HttpResponse(
        serializers.serialize("json", templates),
        mimetype="application/json"
    )
