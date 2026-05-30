from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .models import CategoriaProducto, Producto, Alquiler, DetalleAlquiler, MovimientoInventario
from .serializers import (
    CategoriaProductoSerializer,
    ProductoSerializer,
    AlquilerSerializer,
    DetalleAlquilerSerializer,
    MovimientoInventarioSerializer
)


class CategoriaProductoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaProducto.objects.all()
    serializer_class = CategoriaProductoSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer


class AlquilerViewSet(viewsets.ModelViewSet):
    queryset = Alquiler.objects.all().order_by('-creado_en')
    serializer_class = AlquilerSerializer


class DetalleAlquilerViewSet(viewsets.ModelViewSet):
    queryset = DetalleAlquiler.objects.all()
    serializer_class = DetalleAlquilerSerializer


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by('-creado_en')
    serializer_class = MovimientoInventarioSerializer

    def perform_create(self, serializer):
        producto = serializer.validated_data['producto']
        tipo = serializer.validated_data['tipo']
        cantidad = serializer.validated_data['cantidad']

        salidas = MovimientoInventario.objects.filter(
            producto=producto,
            tipo='salida'
        )

        devoluciones = MovimientoInventario.objects.filter(
            producto=producto,
            tipo='devolucion'
        )

        total_salidas = sum(m.cantidad for m in salidas)
        total_devoluciones = sum(m.cantidad for m in devoluciones)
        cantidad_en_uso = total_salidas - total_devoluciones

        if tipo in ['salida', 'danado', 'perdido', 'fuera_uso']:
            if producto.cantidad_disponible < cantidad:
                raise ValidationError('No hay suficiente inventario disponible')

            producto.cantidad_disponible -= cantidad

        elif tipo == 'devolucion':
            observaciones = serializer.validated_data.get('observaciones', '')

            if 'alquiler No.' in observaciones:
                salidas_alquiler = MovimientoInventario.objects.filter(
                    producto=producto,
                    tipo='salida',
                    observaciones=observaciones.replace('Devolución por', 'Salida por')
                )

                devoluciones_alquiler = MovimientoInventario.objects.filter(
                    producto=producto,
                    tipo='devolucion',
                    observaciones=observaciones
                )

                total_salidas_alquiler = sum(m.cantidad for m in salidas_alquiler)
                total_devoluciones_alquiler = sum(m.cantidad for m in devoluciones_alquiler)

                cantidad_pendiente = total_salidas_alquiler - total_devoluciones_alquiler

                if cantidad > cantidad_pendiente:
                    raise ValidationError('No puedes devolver más cantidad de la que salió en este alquiler')
            else:
                if cantidad > cantidad_en_uso:
                    raise ValidationError('No puedes devolver más cantidad de la que está en uso')

            producto.cantidad_disponible += cantidad

        elif tipo == 'entrada':
            producto.cantidad_disponible += cantidad

        producto.save()
        serializer.save()
