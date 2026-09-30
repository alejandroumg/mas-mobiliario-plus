from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password

from .models import UsuarioSistema, LogActividad
from .serializers import UsuarioSistemaSerializer, LogActividadSerializer

class UsuarioSistemaViewSet(viewsets.ModelViewSet):
    queryset = UsuarioSistema.objects.all().order_by('-fecha_registro')
    serializer_class = UsuarioSistemaSerializer


class LogActividadViewSet(viewsets.ModelViewSet):
    queryset = LogActividad.objects.all().order_by('-fecha')
    serializer_class = LogActividadSerializer
    
@api_view(['POST'])
def login_usuario(request):
    correo = request.data.get('correo', '').strip()
    password = request.data.get('password', '')

    if not correo or not password:
        return Response(
            {'detail': 'Correo y contraseña son obligatorios.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        usuario = UsuarioSistema.objects.get(correo__iexact=correo)
    except UsuarioSistema.DoesNotExist:
        return Response(
            {'detail': 'Credenciales inválidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if usuario.estado != 'activo':
        return Response(
            {'detail': 'El usuario se encuentra inactivo.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if not usuario.password or not check_password(password, usuario.password):
        return Response(
            {'detail': 'Credenciales inválidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    LogActividad.objects.create(
        usuario=usuario,
        accion='Inicio de sesión',
        modulo='Usuarios',
        descripcion=f'El usuario {usuario.nombre} inició sesión en el sistema.'
    )

    return Response({
        'id': usuario.id,
        'nombre': usuario.nombre,
        'correo': usuario.correo,
        'rol': usuario.rol,
        'estado': usuario.estado,
    })