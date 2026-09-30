from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioSistemaViewSet, LogActividadViewSet, login_usuario

router = DefaultRouter()
router.register('usuarios-sistema', UsuarioSistemaViewSet)
router.register('logs-actividad', LogActividadViewSet)

urlpatterns = [
    path('login/', login_usuario),
    path('', include(router.urls)),
]
