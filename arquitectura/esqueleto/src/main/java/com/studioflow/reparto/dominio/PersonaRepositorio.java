package com.studioflow.reparto.dominio;

import java.util.Set;

public interface PersonaRepositorio {

    int contarActores(Set<Long> personaIds);
}
