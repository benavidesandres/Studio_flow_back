package com.studioflow.presupuesto.aplicacion;

import com.studioflow.planificacion.contrato.EscenaProgramada;
import com.studioflow.presupuesto.dominio.Presupuesto;
import com.studioflow.presupuesto.dominio.PresupuestoRepositorio;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ServicioPresupuesto {

    private final PresupuestoRepositorio presupuestos;

    public ServicioPresupuesto(PresupuestoRepositorio presupuestos) {
        this.presupuestos = presupuestos;
    }

    /** Corre dentro de la transacción de quien publica: si esto falla, la escena tampoco se guarda. */
    @EventListener
    public void alProgramarEscena(EscenaProgramada evento) {
        presupuestos.comprometer(evento.produccionId(), evento.costo());
    }

    public Optional<Presupuesto> consultar(long produccionId) {
        return presupuestos.buscar(produccionId);
    }
}
