from rest_framework import serializers
from .models import UsuarioSistema, LogActividad


class UsuarioSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioSistema
        fields = '__all__'


class LogActividadSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = LogActividad
        fields = '__all__'