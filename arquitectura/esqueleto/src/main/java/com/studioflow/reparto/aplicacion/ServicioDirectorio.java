package com.studioflow.reparto.aplicacion;

import com.studioflow.reparto.contrato.DirectorioReparto;
import com.studioflow.reparto.dominio.PersonaRepositorio;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
class ServicioDirectorio implements DirectorioReparto {

    private final PersonaRepositorio personas;

    ServicioDirectorio(PersonaRepositorio personas) {
        this.personas = personas;
    }

    @Override
    public boolean sonTodosActores(Set<Long> personaIds) {
        return personas.contarActores(personaIds) == personaIds.size();
    }
}
