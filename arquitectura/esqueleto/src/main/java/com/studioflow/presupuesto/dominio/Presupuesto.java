package com.studioflow.presupuesto.dominio;

import java.math.BigDecimal;

public record Presupuesto(long produccionId, BigDecimal total, BigDecimal comprometido) {

    public BigDecimal disponible() {
        return total.subtract(comprometido);
    }
}
