package com.studioflow.presupuesto.dominio;

import java.math.BigDecimal;
import java.util.Optional;

public interface PresupuestoRepositorio {

    Optional<Presupuesto> buscar(long produccionId);

    void comprometer(long produccionId, BigDecimal monto);
}
