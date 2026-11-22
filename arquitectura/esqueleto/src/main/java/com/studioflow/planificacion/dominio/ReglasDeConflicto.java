package com.studioflow.planificacion.dominio;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Reglas puras: sin framework ni base de datos, para probarlas y razonarlas de forma aislada. */
public final class ReglasDeConflicto {

    private final int minutosMinimosTraslado;

    public ReglasDeConflicto(int minutosMinimosTraslado) {
        this.minutosMinimosTraslado = minutosMinimosTraslado;
    }

    public List<Conflicto> evaluar(long actorId, Franja candidata, List<Franja> agenda) {
        List<Conflicto> conflictos = new ArrayList<>();
        for (Franja existente : agenda) {
            if (seSolapan(candidata, existente)) {
                conflictos.add(new Conflicto(Conflicto.Tipo.SOLAPAMIENTO, actorId, existente.escena(), null));
            } else if (requiereTraslado(candidata, existente)) {
                long margen = margenEnMinutos(candidata, existente);
                if (margen < minutosMinimosTraslado) {
                    conflictos.add(new Conflicto(Conflicto.Tipo.TRASLADO_INSUFICIENTE, actorId, existente.escena(), margen));
                }
            }
        }
        return conflictos;
    }

    private static boolean seSolapan(Franja a, Franja b) {
        return a.inicio().isBefore(b.fin()) && b.inicio().isBefore(a.fin());
    }

    private static boolean requiereTraslado(Franja a, Franja b) {
        return a.inicio().toLocalDate().equals(b.inicio().toLocalDate())
                && !a.locacion().trim().equalsIgnoreCase(b.locacion().trim());
    }

    private static long margenEnMinutos(Franja a, Franja b) {
        return a.inicio().isBefore(b.inicio())
                ? Duration.between(a.fin(), b.inicio()).toMinutes()
                : Duration.between(b.fin(), a.inicio()).toMinutes();
    }
}
