package com.studioflow.reparto.infraestructura;

import com.studioflow.reparto.dominio.PersonaRepositorio;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
class PersonaRepositorioJdbc implements PersonaRepositorio {

    private final JdbcClient jdbc;

    PersonaRepositorioJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public int contarActores(Set<Long> personaIds) {
        if (personaIds.isEmpty()) {
            return 0;
        }
        return jdbc.sql("SELECT COUNT(*) FROM reparto_persona WHERE rol = 'ACTOR' AND id IN (:ids)")
                .param("ids", personaIds)
                .query(Integer.class)
                .single();
    }
}
