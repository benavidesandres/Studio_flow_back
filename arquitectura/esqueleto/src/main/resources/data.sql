INSERT INTO reparto_persona (id, nombre, rol) VALUES
    (1, 'Actriz Demo', 'ACTOR'),
    (2, 'Actor Demo', 'ACTOR'),
    (9, 'Técnica Demo', 'CREW');

INSERT INTO planificacion_agenda_actor (actor_id) VALUES (1), (2);

INSERT INTO presupuesto_produccion (produccion_id, total, comprometido) VALUES (1, 1000000.00, 0.00);
