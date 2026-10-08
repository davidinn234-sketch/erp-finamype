export function aiFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = Number((error as { status?: number; code?: number })?.status || (error as { code?: number })?.code);
  if (message.includes('GEMINI_API_KEY')) return { status: 503, code: 'AI_NOT_CONFIGURED', error: 'El asistente necesita una clave de Gemini configurada en el servidor. El administrador puede activar esta conexión.' };
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.limit/i.test(message)) return { status: 429, code: 'AI_QUOTA_EXCEEDED', error: 'Gemini alcanzó el límite de uso de esta cuenta. Revisa su cuota o espera antes de intentar otra vez.' };
  if ([401, 403].includes(status) || /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(message)) return { status: 503, code: 'AI_KEY_REJECTED', error: 'Gemini rechazó la clave del servidor. El administrador debe revisar la conexión del asistente.' };
  if (status === 404 || /model.*not found|NOT_FOUND/i.test(message)) return { status: 503, code: 'AI_MODEL_UNAVAILABLE', error: 'El modelo de Gemini configurado no está disponible para esta cuenta. El administrador debe actualizarlo.' };
  return { status: 503, code: 'AI_UNAVAILABLE', error: 'El asistente no pudo responder en este momento. Inténtalo de nuevo. No se registró ninguna operación.' };
}
