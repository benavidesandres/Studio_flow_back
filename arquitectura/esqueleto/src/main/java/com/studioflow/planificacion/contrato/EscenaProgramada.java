package com.studioflow.planificacion.contrato;

import java.math.BigDecimal;

/** Lo único que Planificación publica hacia otros módulos. */
public record EscenaProgramada(long escenaId, long produccionId, BigDecimal costo) {
}
