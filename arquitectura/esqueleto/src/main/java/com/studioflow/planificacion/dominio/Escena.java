package com.studioflow.planificacion.dominio;

import java.math.BigDecimal;
import java.util.Set;

public record Escena(long produccionId, Franja franja, BigDecimal costo, Set<Long> actorIds) {
}
