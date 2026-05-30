from rest_framework import serializers
from .models import (
    Contacto,
    CategoriaContacto,
    EtiquetaContacto,
    ObservacionContacto,
    InteraccionContacto
)


class CategoriaContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaContacto
        fields = '__all__'


class EtiquetaContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtiquetaContacto
        fields = '__all__'


class ContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacto
        fields = '__all__'


class ObservacionContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservacionContacto
        fields = '__all__'


class InteraccionContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteraccionContacto
        fields = '__all__'
