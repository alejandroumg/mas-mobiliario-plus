from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaProductoViewSet,
    ProductoViewSet,
    AlquilerViewSet,
    DetalleAlquilerViewSet,
    MovimientoInventarioViewSet
)

router = DefaultRouter()
router.register('categorias-producto', CategoriaProductoViewSet)
router.register('productos', ProductoViewSet)
router.register('alquileres', AlquilerViewSet)
router.register('detalle-alquiler', DetalleAlquilerViewSet)
router.register('movimientos-inventario', MovimientoInventarioViewSet)

urlpatterns = router.urls