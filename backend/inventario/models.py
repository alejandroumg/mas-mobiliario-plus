from django.db import models
from contactos.models import Contacto


class CategoriaProducto(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    ESTADOS = [
        ('disponible', 'Disponible'),
        ('danado', 'Dañado'),
        ('fuera_uso', 'Fuera de uso'),
    ]

    nombre = models.CharField(max_length=150)
    categoria = models.ForeignKey(CategoriaProducto, on_delete=models.SET_NULL, null=True, blank=True)
    cantidad_disponible = models.PositiveIntegerField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='disponible')
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Alquiler(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]

    cliente = models.ForeignKey(Contacto, on_delete=models.CASCADE)
    fecha_evento = models.DateField()
    direccion_evento = models.TextField()
    responsable = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    observaciones = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alquiler de {self.cliente.nombre}"


class DetalleAlquiler(models.Model):
    alquiler = models.ForeignKey(Alquiler, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"


class MovimientoInventario(models.Model):
    TIPOS = [
    ('entrada', 'Entrada'),
    ('salida', 'Salida / En alquiler'),
    ('devolucion', 'Devolución'),
    ('danado', 'Dañado'),
    ('perdido', 'Perdido'),
    ('fuera_uso', 'Fuera de uso'),
]

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.PositiveIntegerField()
    observaciones = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.producto.nombre}"