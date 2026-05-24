from rest_framework import serializers
from .models import CategoriaProducto, Producto, Alquiler, DetalleAlquiler, MovimientoInventario


class CategoriaProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaProducto
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class DetalleAlquilerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleAlquiler
        fields = '__all__'


class AlquilerSerializer(serializers.ModelSerializer):
    detalles = DetalleAlquilerSerializer(many=True, read_only=True)

    class Meta:
        model = Alquiler
        fields = '__all__'


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = '__all__'