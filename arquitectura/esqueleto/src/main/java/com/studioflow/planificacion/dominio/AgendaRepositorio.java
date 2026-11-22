package com.studioflow.planificacion.dominio;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Puerto de salida: el dominio define qué necesita y la infraestructura lo implementa. */
public interface AgendaRepositorio {

    /** Serializa los cambios sobre estas agendas hasta el fin de la transacción. */
    void bloquearAgendas(Set<Long> actorIds);

    List<Franja> franjasDe(long actorId, LocalDateTime desde, LocalDateTime hasta);

    long guardar(Escena escena);
}
