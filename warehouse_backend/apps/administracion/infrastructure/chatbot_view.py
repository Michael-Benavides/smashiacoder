# apps/administracion/infrastructure/chatbot_view.py
"""
Endpoint del chatbot del sistema SmashIACodeR.

Backend: Groq (Llama 3.3 70B versatile). Configurado por las variables de
entorno ``GROQ_API_KEY`` y ``GROQ_MODEL``. NO se usa Anthropic.
"""

import environ
from groq import Groq
from rest_framework import serializers
from rest_framework.views import APIView

from shared.responses import error_response, success_response

env = environ.Env()


SYSTEM_PROMPT = """Eres el asistente inteligente de SmashIACodeR.
Tienes acceso conceptual al sistema de inventarios y puedes ayudar con consultas.

REGLAS IMPORTANTES:
1. Si el usuario pide datos tabulares (listas de clientes, productos, movimientos, etc.):
   - Si son MENOS de 20 registros: responde con una tabla en formato Markdown (| col | col |)
   - Si son MÁS de 20 registros: responde exactamente con: "GENERAR_PDF:<tipo>" donde tipo es: clientes, productos, proveedores, movimientos o inventario
   - Ejemplos: "GENERAR_PDF:clientes", "GENERAR_PDF:productos"
2. Para preguntas generales del sistema responde normalmente en español.
3. Sé conciso y profesional. Máximo 3 párrafos en respuestas de texto.
"""

ROLES_VALIDOS = {"user", "assistant", "system"}


class _MensajeHistorialSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=sorted(ROLES_VALIDOS))
    content = serializers.CharField(allow_blank=False)


class ChatbotMensajeSerializer(serializers.Serializer):
    mensaje = serializers.CharField(max_length=4000, error_messages={
        "required": "El mensaje es obligatorio.",
        "blank": "El mensaje no puede estar vacío.",
        "max_length": "El mensaje no puede superar los 4000 caracteres.",
    })
    historial = serializers.ListField(
        child=_MensajeHistorialSerializer(),
        required=False,
        default=list,
    )


class ChatbotMensajeView(APIView):
    """POST /administracion/chatbot/mensaje

    Body:
        {
            "mensaje": "<str>",
            "historial": [
                {"role": "user"|"assistant"|"system", "content": "<str>"},
                ...
            ]   # opcional
        }

    Devuelve la respuesta generada por el modelo de Groq, junto con
    el conteo de tokens consumidos.
    """

    def post(self, request):
        serializer = ChatbotMensajeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del mensaje inválidos.", serializer.errors)

        mensaje = serializer.validated_data['mensaje']
        historial = serializer.validated_data.get('historial', []) or []

        api_key = env('GROQ_API_KEY', default='')
        if not api_key:
            return error_response(
                "El chatbot no está configurado en este entorno.",
                details={"GROQ_API_KEY": "La variable de entorno no está definida."},
                status_code=503,
            )

        modelo = env('GROQ_MODEL', default='llama-3.3-70b-versatile')

        # Filtramos cualquier 'system' del historial: el system prompt
        # canónico del asistente es responsabilidad del backend.
        historial_limpio = [
            {"role": m["role"], "content": m["content"]}
            for m in historial
            if m.get("role") in {"user", "assistant"}
            and m.get("content")
        ]

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *historial_limpio,
            {"role": "user", "content": mensaje},
        ]

        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model=modelo,
                messages=messages,
                max_tokens=1000,
                temperature=0.4,
            )
        except Exception as exc:
            return error_response(
                "No se pudo procesar el mensaje del chatbot.",
                details={"error": str(exc)},
                status_code=502,
            )

        try:
            respuesta_texto = response.choices[0].message.content or ""
        except (IndexError, AttributeError):
            respuesta_texto = ""

        usage = getattr(response, "usage", None)
        tokens_entrada = getattr(usage, "prompt_tokens", None) if usage else None
        tokens_salida = getattr(usage, "completion_tokens", None) if usage else None
        tokens_totales = getattr(usage, "total_tokens", None) if usage else None

        return success_response(
            data={
                "respuesta": respuesta_texto,
                "modelo": modelo,
                "tokens_entrada": tokens_entrada,
                "tokens_salida": tokens_salida,
                "tokens_totales": tokens_totales,
            },
            message="Respuesta generada exitosamente.",
        )
