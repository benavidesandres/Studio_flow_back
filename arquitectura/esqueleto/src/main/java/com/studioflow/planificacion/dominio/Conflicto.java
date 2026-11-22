package com.studioflow.planificacion.dominio;

public record Conflicto(Tipo tipo, long actorId, String escena, Long minutosDeMargen) {

    public enum Tipo {
        /** Bloqueante: una misma persona no puede estar en dos escenas a la vez. */
        SOLAPAMIENTO,
        /** Advertencia: el productor puede aceptarla de forma explícita. */
        TRASLADO_INSUFICIENTE
    }

    public boolean esBloqueante() {
        return tipo == Tipo.SOLAPAMIENTO;
    }
}
