package com.studioflow.planificacion.dominio;

import java.time.LocalDateTime;

/** Intervalo que una escena ocupa en la agenda de un actor. */
public record Franja(LocalDateTime inicio, LocalDateTime fin, String locacion, String escena) {

    public Franja {
        if (!fin.isAfter(inicio)) {
            throw new IllegalArgumentException("La escena debe terminar después de empezar");
        }
    }
}
