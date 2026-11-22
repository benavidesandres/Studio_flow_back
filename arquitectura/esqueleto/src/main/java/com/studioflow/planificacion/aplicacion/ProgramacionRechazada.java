package com.studioflow.planificacion.aplicacion;

import com.studioflow.planificacion.dominio.Conflicto;

import java.util.List;

public class ProgramacionRechazada extends RuntimeException {

    private final transient List<Conflicto> conflictos;

    public ProgramacionRechazada(List<Conflicto> conflictos) {
        super("La escena tiene conflictos de agenda");
        this.conflictos = conflictos;
    }

    public List<Conflicto> conflictos() {
        return conflictos;
    }
}
