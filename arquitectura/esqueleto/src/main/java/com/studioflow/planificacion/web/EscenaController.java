package com.studioflow.planificacion.web;

import com.studioflow.planificacion.aplicacion.ProgramacionRechazada;
import com.studioflow.planificacion.aplicacion.ProgramarEscena;
import com.studioflow.planificacion.dominio.Conflicto;
import com.studioflow.planificacion.dominio.Franja;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/planificacion/escenas")
class EscenaController {

    record ProgramarEscenaRequest(
            long produccionId,
            String numero,
            LocalDateTime inicio,
            LocalDateTime fin,
            String locacion,
            BigDecimal costo,
            Set<Long> actorIds,
            boolean aceptarAdvertencias) {
    }

    private final ProgramarEscena programarEscena;

    EscenaController(ProgramarEscena programarEscena) {
        this.programarEscena = programarEscena;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ProgramarEscena.Resultado programar(@RequestBody ProgramarEscenaRequest request) {
        Franja franja = new Franja(request.inicio(), request.fin(), request.locacion(), request.numero());
        return programarEscena.ejecutar(new ProgramarEscena.Comando(
                request.produccionId(), franja, request.costo(), request.actorIds(), request.aceptarAdvertencias()));
    }

    @ExceptionHandler(ProgramacionRechazada.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    Map<String, List<Conflicto>> rechazada(ProgramacionRechazada error) {
        return Map.of("conflictos", error.conflictos());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, String> invalida(IllegalArgumentException error) {
        return Map.of("error", error.getMessage());
    }
}
