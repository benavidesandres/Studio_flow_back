package com.studioflow;

import com.studioflow.planificacion.aplicacion.ProgramacionRechazada;
import com.studioflow.planificacion.aplicacion.ProgramarEscena;
import com.studioflow.planificacion.dominio.Conflicto;
import com.studioflow.planificacion.dominio.Franja;
import com.studioflow.presupuesto.aplicacion.ServicioPresupuesto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class FlujoDeProgramacionTest {

    @Autowired
    private ProgramarEscena programarEscena;

    @Autowired
    private ServicioPresupuesto presupuestos;

    private static ProgramarEscena.Comando comando(LocalDate dia, int horaInicio, int minutoInicio, int horaFin, String locacion, boolean aceptar) {
        LocalDateTime inicio = dia.atTime(horaInicio, minutoInicio);
        return new ProgramarEscena.Comando(
                1L, new Franja(inicio, dia.atTime(horaFin, 0), locacion, "SC-" + inicio), new BigDecimal("1000.00"), Set.of(1L), aceptar);
    }

    private BigDecimal comprometido() {
        return presupuestos.consultar(1L).orElseThrow().comprometido();
    }

    @Test
    void elSolapamientoSeRechazaYNoComprometePresupuesto() {
        LocalDate dia = LocalDate.of(2030, 1, 10);
        programarEscena.ejecutar(comando(dia, 8, 0, 10, "Estudio", false));
        BigDecimal antes = comprometido();

        var error = assertThrows(ProgramacionRechazada.class,
                () -> programarEscena.ejecutar(comando(dia, 9, 0, 11, "Estudio", true)));

        assertEquals(Conflicto.Tipo.SOLAPAMIENTO, error.conflictos().get(0).tipo());
        assertEquals(0, antes.compareTo(comprometido()));
    }

    @Test
    void elTrasladoInsuficienteSoloPasaSiSeAceptaYComprometePresupuesto() {
        LocalDate dia = LocalDate.of(2030, 2, 10);
        programarEscena.ejecutar(comando(dia, 8, 0, 10, "Estudio", false));

        assertThrows(ProgramacionRechazada.class,
                () -> programarEscena.ejecutar(comando(dia, 10, 30, 12, "Centro", false)));

        BigDecimal antes = comprometido();
        var resultado = programarEscena.ejecutar(comando(dia, 10, 30, 12, "Centro", true));

        assertEquals(Conflicto.Tipo.TRASLADO_INSUFICIENTE, resultado.advertencias().get(0).tipo());
        assertEquals(0, antes.add(new BigDecimal("1000.00")).compareTo(comprometido()));
    }

    @Test
    void soloSePuedeCitarAActores() {
        LocalDate dia = LocalDate.of(2030, 3, 10);
        var comando = new ProgramarEscena.Comando(
                1L, new Franja(dia.atTime(8, 0), dia.atTime(9, 0), "Estudio", "SC-X"), BigDecimal.TEN, Set.of(9L), false);

        assertThrows(IllegalArgumentException.class, () -> programarEscena.ejecutar(comando));
    }

    @Test
    void dosProgramacionesSimultaneasNoCitanDosVecesAlMismoActor() throws Exception {
        LocalDate dia = LocalDate.of(2030, 4, 10);
        int hilos = 8;
        var salida = new CountDownLatch(1);
        var ejecutor = Executors.newFixedThreadPool(hilos);
        List<Future<ProgramarEscena.Resultado>> intentos = new ArrayList<>();

        Callable<ProgramarEscena.Resultado> intento = () -> {
            salida.await();
            return programarEscena.ejecutar(comando(dia, 8, 0, 10, "Estudio", true));
        };
        for (int i = 0; i < hilos; i++) {
            intentos.add(ejecutor.submit(intento));
        }
        salida.countDown();

        int aceptadas = 0;
        int rechazadas = 0;
        for (var futuro : intentos) {
            try {
                futuro.get();
                aceptadas++;
            } catch (ExecutionException error) {
                assertInstanceOf(ProgramacionRechazada.class, error.getCause());
                rechazadas++;
            }
        }
        ejecutor.shutdown();

        assertEquals(1, aceptadas);
        assertEquals(hilos - 1, rechazadas);
    }
}
