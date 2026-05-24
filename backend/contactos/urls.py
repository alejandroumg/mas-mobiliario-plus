from rest_framework.routers import DefaultRouter
from .views import (
    ContactoViewSet,
    CategoriaContactoViewSet,
    EtiquetaContactoViewSet,
    ObservacionContactoViewSet
)

router = DefaultRouter()
router.register('contactos', ContactoViewSet)
router.register('categorias-contacto', CategoriaContactoViewSet)
router.register('etiquetas-contacto', EtiquetaContactoViewSet)
router.register('observaciones-contacto', ObservacionContactoViewSet)

urlpatterns = router.urls