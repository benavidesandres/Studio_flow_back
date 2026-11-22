package com.studioflow.presupuesto.infraestructura;

import com.studioflow.presupuesto.dominio.Presupuesto;
import com.studioflow.presupuesto.dominio.PresupuestoRepositorio;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
class PresupuestoRepositorioJdbc implements PresupuestoRepositorio {

    private final JdbcClient jdbc;

    PresupuestoRepositorioJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Presupuesto> buscar(long produccionId) {
        return jdbc.sql("SELECT produccion_id, total, comprometido FROM presupuesto_produccion WHERE produccion_id = ?")
                .param(produccionId)
                .query((rs, fila) -> new Presupuesto(
                        rs.getLong("produccion_id"),
                        rs.getBigDecimal("total"),
                        rs.getBigDecimal("comprometido")))
                .optional();
    }

    @Override
    public void comprometer(long produccionId, BigDecimal monto) {
        int filas = jdbc.sql("UPDATE presupuesto_produccion SET comprometido = comprometido + ? WHERE produccion_id = ?")
                .params(monto, produccionId)
                .update();
        if (filas == 0) {
            throw new IllegalArgumentException("La producción " + produccionId + " no tiene presupuesto");
        }
    }
}
