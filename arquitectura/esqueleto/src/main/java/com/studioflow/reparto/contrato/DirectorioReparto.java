package com.studioflow.reparto.contrato;

import java.util.Set;

/** Lo único que Reparto expone a otros módulos. */
public interface DirectorioReparto {

    boolean sonTodosActores(Set<Long> personaIds);
}
