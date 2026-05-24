from rest_framework import viewsets
from .models import Contacto, CategoriaContacto, EtiquetaContacto, ObservacionContacto
from .serializers import (
    ContactoSerializer,
    CategoriaContactoSerializer,
    EtiquetaContactoSerializer,
    ObservacionContactoSerializer
)


class ContactoViewSet(viewsets.ModelViewSet):
    queryset = Contacto.objects.all().order_by('-creado_en')
    serializer_class = ContactoSerializer


class CategoriaContactoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaContacto.objects.all()
    serializer_class = CategoriaContactoSerializer


class EtiquetaContactoViewSet(viewsets.ModelViewSet):
    queryset = EtiquetaContacto.objects.all()
    serializer_class = EtiquetaContactoSerializer


class ObservacionContactoViewSet(viewsets.ModelViewSet):
    queryset = ObservacionContacto.objects.all().order_by('-creado_en')
    serializer_class = ObservacionContactoSerializer