from django.db import models


class UsuarioSistema(models.Model):
    ROLES = [
        ('administrador', 'Administrador'),
        ('usuario', 'Usuario'),
    ]

    ESTADOS = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=ROLES, default='usuario')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class LogActividad(models.Model):
    usuario = models.ForeignKey(
        UsuarioSistema,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    accion = models.CharField(max_length=100)
    modulo = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.modulo} - {self.accion}'