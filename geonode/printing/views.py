import urllib2
from django.conf import settings
from django.http import HttpResponse
from django.utils import simplejson as json
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.template import Context, RequestContext, loader, Template
from django.core import serializers
from geonode.maps.models import Map
from geonode.layers.models import Layer
from geonode.printing.models import PrintTemplate


def printing_print(request, templateid, mapid=None, layerid=None):
    """interpolate the template with the given id"""
    template_obj = get_object_or_404(PrintTemplate, pk=templateid)
    resource_obj = None
    if mapid is not None:
        resource_obj = get_object_or_404(Map, pk=mapid)
    else:
        resource_obj = get_object_or_404(Layer, typename=layerid)

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
    resource_map = (mapid is not None) and {"map": resource_obj} or {"layer": resource_obj}
    context = RequestContext(request, resource_map)
    try:
        rendered = template.render(context)
    except Exception, e:
        return HttpResponse(
            "Error rendering template",
            mimetype="text/plain",
            status=500
        )

    try:
        printed = urllib2.urlopen(settings.GEOSERVER_PRINT_URL, rendered)
    except Exception, e:
        return HttpResponse(
            e.message,
            mimetype="text/plain",
            status=e.code or 500
        )
    return HttpResponse(printed, content_type="application/pdf")

#require_GET()
def printing_template_list(request):
    """list the available templates"""
    templates = PrintTemplate.objects.all()
    return HttpResponse(
        serializers.serialize("json", templates),
        mimetype="application/json"
    );
