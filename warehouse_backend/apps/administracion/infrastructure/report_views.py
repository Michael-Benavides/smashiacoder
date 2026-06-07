# apps/administracion/infrastructure/report_views.py
"""Vistas API para informes gerenciales de bodega (PDF / Excel / correo)."""

from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import serializers, status
from rest_framework.views import APIView

from apps.seguridad.infrastructure.permissions import EsAdministrador
from shared.responses import error_response, success_response

from .report_generators import (
    PDF_BUILDERS,
    REPORTE_LABELS,
    generar_reporte_bytes,
    generar_reporte_http,
)

TIPOS_VALIDOS = frozenset(PDF_BUILDERS.keys())


class _ReporteDownloadView(APIView):
    """Base para descarga GET /reportes/<tipo>/<formato>."""
    permission_classes = [EsAdministrador]

    tipo: str = ''

    def get(self, request):
        formato = self._formato_from_path(request)
        if formato not in ('pdf', 'excel'):
            return error_response('Formato no válido.', status_code=status.HTTP_404_NOT_FOUND)
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        return generar_reporte_http(self.tipo, formato, fecha_desde, fecha_hasta)

    def _formato_from_path(self, request) -> str:
        raise NotImplementedError


def _make_download_view(reporte_tipo: str, reporte_formato: str):
    class View(_ReporteDownloadView):
        tipo = reporte_tipo

        def get(self, request):
            fecha_desde = request.query_params.get('fecha_desde')
            fecha_hasta = request.query_params.get('fecha_hasta')
            return generar_reporte_http(
                reporte_tipo, reporte_formato, fecha_desde, fecha_hasta,
            )

    View.__doc__ = f'GET /reportes/{reporte_tipo}/{reporte_formato}'
    View.__name__ = f'Reporte{reporte_tipo.title()}{reporte_formato.upper()}View'
    return View


ReporteGeneralPDFView = _make_download_view('general', 'pdf')
ReporteGeneralExcelView = _make_download_view('general', 'excel')
ReporteInventarioPDFView = _make_download_view('inventario', 'pdf')
ReporteInventarioExcelView = _make_download_view('inventario', 'excel')
ReporteMovimientosPDFView = _make_download_view('movimientos', 'pdf')
ReporteMovimientosExcelView = _make_download_view('movimientos', 'excel')
ReporteClientesPDFView = _make_download_view('clientes', 'pdf')
ReporteClientesExcelView = _make_download_view('clientes', 'excel')
ReporteProveedoresPDFView = _make_download_view('proveedores', 'pdf')
ReporteProveedoresExcelView = _make_download_view('proveedores', 'excel')


class EnviarReporteSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages={
        'required': 'El correo electrónico es obligatorio.',
        'invalid': 'Ingrese un correo electrónico válido.',
    })
    formato = serializers.ChoiceField(
        choices=['pdf', 'excel'],
        error_messages={'invalid_choice': "El formato debe ser 'pdf' o 'excel'."},
    )
    fecha_desde = serializers.DateField(required=False, allow_null=True)
    fecha_hasta = serializers.DateField(required=False, allow_null=True)


class EnviarReporteView(APIView):
    """POST /reportes/<tipo>/enviar — envía el informe como adjunto por email."""
    permission_classes = [EsAdministrador]

    def post(self, request, tipo: str):
        if tipo not in TIPOS_VALIDOS:
            return error_response(
                'Tipo de reporte no válido.',
                details={'tipo': f"'{tipo}' no es un reporte disponible."},
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = EnviarReporteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Datos inválidos.', serializer.errors)

        email_destino = serializer.validated_data['email']
        formato = serializer.validated_data['formato']
        fecha_desde = serializer.validated_data.get('fecha_desde')
        fecha_hasta = serializer.validated_data.get('fecha_hasta')
        fd = fecha_desde.isoformat() if fecha_desde else None
        fh = fecha_hasta.isoformat() if fecha_hasta else None

        if not settings.EMAIL_HOST_USER:
            return error_response(
                'El servidor de correo no está configurado.',
                details={'email': 'Configure EMAIL_HOST_USER en el entorno del backend.'},
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            contenido, nombre_archivo, content_type = generar_reporte_bytes(
                tipo, formato, fd, fh,
            )
            label = REPORTE_LABELS.get(tipo, tipo)
            msg = EmailMessage(
                subject=f'Warehouse IQ — {label}',
                body=(
                    f'Adjunto encontrará el informe "{label}" '
                    f'en formato {formato.upper()}.\n\n'
                    '— Warehouse IQ'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_destino],
            )
            msg.attach(nombre_archivo, contenido, content_type)
            msg.send(fail_silently=False)
        except Exception as exc:
            return error_response(
                'No se pudo enviar el reporte por correo.',
                details={'error': str(exc)},
                status_code=status.HTTP_502_BAD_GATEWAY,
            )

        return success_response(
            data={'email': email_destino, 'tipo': tipo, 'formato': formato},
            message=f'Reporte enviado a {email_destino}.',
            status_code=status.HTTP_200_OK,
        )
