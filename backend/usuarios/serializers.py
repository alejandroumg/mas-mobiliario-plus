from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UsuarioSistema, LogActividad


class UsuarioSistemaSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = UsuarioSistema
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password', '')

        usuario = UsuarioSistema(**validated_data)

        if password:
            usuario.password = make_password(password)

        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.password = make_password(password)

        instance.save()
        return instance


class LogActividadSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = LogActividad
        fields = '__all__'