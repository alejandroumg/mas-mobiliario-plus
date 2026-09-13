from rest_framework import viewsets
from .models import UsuarioSistema, LogActividad
from .serializers import UsuarioSistemaSerializer, LogActividadSerializer


class UsuarioSistemaViewSet(viewsets.ModelViewSet):
    queryset = UsuarioSistema.objects.all().order_by('-fecha_registro')
    serializer_class = UsuarioSistemaSerializer


class LogActividadViewSet(viewsets.ModelViewSet):
    queryset = LogActividad.objects.all().order_by('-fecha')
    serializer_class = LogActividadSerializer