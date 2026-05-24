from django.db import models


class CategoriaContacto(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class EtiquetaContacto(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Contacto(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('seguimiento', 'Seguimiento'),
    ]

    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    correo_electronico = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    empresa_organizacion = models.CharField(max_length=150, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)

    categoria = models.ForeignKey(CategoriaContacto, on_delete=models.SET_NULL, null=True, blank=True)
    etiquetas = models.ManyToManyField(EtiquetaContacto, blank=True)

    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    observaciones = models.TextField(blank=True, null=True)

    medio_contacto = models.CharField(max_length=100, blank=True, null=True)
    responsable = models.CharField(max_length=100, blank=True, null=True)
    proxima_interaccion = models.DateField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class ObservacionContacto(models.Model):
    contacto = models.ForeignKey(Contacto, on_delete=models.CASCADE, related_name='historial_observaciones')
    descripcion = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Observación de {self.contacto.nombre}"