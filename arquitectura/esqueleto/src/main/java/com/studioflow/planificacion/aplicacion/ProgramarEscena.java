package com.studioflow.planificacion.aplicacion;

import com.studioflow.planificacion.contrato.EscenaProgramada;
import com.studioflow.planificacion.dominio.AgendaRepositorio;
import com.studioflow.planificacion.dominio.Conflicto;
import com.studioflow.planificacion.dominio.Escena;
import com.studioflow.planificacion.dominio.Franja;
import com.studioflow.planificacion.dominio.ReglasDeConflicto;
import com.studioflow.reparto.contrato.DirectorioReparto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ProgramarEscena {

    public record Comando(long produccionId, Franja franja, BigDecimal costo, Set<Long> actorIds, boolean aceptarAdvertencias) {
    }

    public record Resultado(long escenaId, List<Conflicto> advertencias) {
    }

    private final AgendaRepositorio agenda;
    private final DirectorioReparto reparto;
    private final ApplicationEventPublisher eventos;
    private final ReglasDeConflicto reglas;

    public ProgramarEscena(
            AgendaRepositorio agenda,
            DirectorioReparto reparto,
            ApplicationEventPublisher eventos,
            @Value("${studioflow.planificacion.minutos-minimos-traslado}") int minutosMinimosTraslado) {
        this.agenda = agenda;
        this.reparto = reparto;
        this.eventos = eventos;
        this.reglas = new ReglasDeConflicto(minutosMinimosTraslado);
    }

    @Transactional
    public Resultado ejecutar(Comando comando) {
        if (!reparto.sonTodosActores(comando.actorIds())) {
            throw new IllegalArgumentException("Solo se puede citar a personas con rol de actor");
        }

        // El bloqueo va antes de leer: sin él, dos programaciones simultáneas validarían
        // contra la misma agenda y ambas pasarían.
        agenda.bloquearAgendas(comando.actorIds());

        List<Conflicto> conflictos = detectarConflictos(comando);
        boolean hayBloqueante = conflictos.stream().anyMatch(Conflicto::esBloqueante);
        if (hayBloqueante || (!conflictos.isEmpty() && !comando.aceptarAdvertencias())) {
            throw new ProgramacionRechazada(conflictos);
        }

        long escenaId = agenda.guardar(new Escena(comando.produccionId(), comando.franja(), comando.costo(), comando.actorIds()));
        eventos.publishEvent(new EscenaProgramada(escenaId, comando.produccionId(), comando.costo()));
        return new Resultado(escenaId, conflictos);
    }

    private List<Conflicto> detectarConflictos(Comando comando) {
        Franja franja = comando.franja();
        // Ventana de un día a cada lado: cubre rodajes nocturnos que cruzan la medianoche.
        var desde = franja.inicio().toLocalDate().minusDays(1).atStartOfDay();
        var hasta = franja.fin().toLocalDate().plusDays(2).atStartOfDay();

        List<Conflicto> conflictos = new ArrayList<>();
        for (long actorId : comando.actorIds()) {
            conflictos.addAll(reglas.evaluar(actorId, franja, agenda.franjasDe(actorId, desde, hasta)));
        }
        return conflictos;
    }
}
