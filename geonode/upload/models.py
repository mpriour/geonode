from datetime import datetime
from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from geonode.layers.models import Layer
import logging


logger = logging.getLogger(__name__)


class UploadManager(models.Manager):
    def __init__(self):
        models.Manager.__init__(self)

    def update_from_session(self, import_session):
        import_obj = self.get(import_id=import_session.id)
        import_obj.update_from_session(import_session)

    def create_from_session(self, user, import_session):
        return self.create(
            user=user,
            import_id=import_session.id,
            state=import_session.state)


class Upload(models.Model):
    objects = UploadManager()

    import_id = models.BigIntegerField()
    user = models.ForeignKey(User, blank=True, null=True)
    state = models.CharField(max_length=16)
    date = models.DateTimeField('date', default=datetime.now)

    def update_from_session(self, import_session):
        self.state = import_session.state
        self.save()

    def get_import_url(self):
        return "%srest/imports/%s" % (settings.GEOSERVER_BASE_URL,
                                      self.import_id)

    def delete(self, cascade=True):
        models.Model.delete(self)
        if cascade:
            session = Layer.objects.gs_uploader.get_session(self.import_id)
            if session:
                try:
                    session.delete()
                except Exception:
                    logger.exception('error deleting upload session')
                    raise
