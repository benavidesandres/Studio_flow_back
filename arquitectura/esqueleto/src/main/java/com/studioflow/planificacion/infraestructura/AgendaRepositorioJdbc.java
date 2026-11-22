package com.studioflow.planificacion.infraestructura;

import com.studioflow.planificacion.dominio.AgendaRepositorio;
import com.studioflow.planificacion.dominio.Escena;
import com.studioflow.planificacion.dominio.Franja;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

@Repository
class AgendaRepositorioJdbc implements AgendaRepositorio {

    private final JdbcClient jdbc;

    AgendaRepositorioJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void bloquearAgendas(Set<Long> actorIds) {
        // Siempre en el mismo orden, uno a uno, para que dos transacciones no se bloqueen mutuamente.
        for (long actorId : new TreeSet<>(actorIds)) {
            jdbc.sql("SELECT actor_id FROM planificacion_agenda_actor WHERE actor_id = ? FOR UPDATE")
                    .param(actorId)
                    .query(Long.class)
                    .list();
        }
    }

    @Override
    public List<Franja> franjasDe(long actorId, LocalDateTime desde, LocalDateTime hasta) {
        return jdbc.sql("""
                        SELECT e.inicio, e.fin, e.locacion, e.numero
                        FROM planificacion_escena e
                        JOIN planificacion_escena_actor ea ON ea.escena_id = e.id
                        WHERE ea.actor_id = ? AND e.inicio < ? AND e.fin > ?
                        """)
                .params(actorId, Timestamp.valueOf(hasta), Timestamp.valueOf(desde))
                .query((rs, fila) -> new Franja(
                        rs.getTimestamp("inicio").toLocalDateTime(),
                        rs.getTimestamp("fin").toLocalDateTime(),
                        rs.getString("locacion"),
                        rs.getString("numero")))
                .list();
    }

    @Override
    public long guardar(Escena escena) {
        var llave = new GeneratedKeyHolder();
        jdbc.sql("""
                        INSERT INTO planificacion_escena (produccion_id, numero, inicio, fin, locacion, costo)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """)
                .params(
                        escena.produccionId(),
                        escena.franja().escena(),
                        Timestamp.valueOf(escena.franja().inicio()),
                        Timestamp.valueOf(escena.franja().fin()),
                        escena.franja().locacion(),
                        escena.costo())
                .update(llave, "id");
        long escenaId = Objects.requireNonNull(llave.getKey()).longValue();

        for (long actorId : escena.actorIds()) {
            jdbc.sql("INSERT INTO planificacion_escena_actor (escena_id, actor_id) VALUES (?, ?)")
                    .params(escenaId, actorId)
                    .update();
        }
        return escenaId;
    }
}
