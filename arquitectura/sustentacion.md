# Guía de sustentación (7 min defensa + 3 min preguntas)

Esta guía es para estudiar, no para leer en voz alta. Cada respuesta remite a algo concreto de `docs/diseno.html` o del código. Si una respuesta no la pueden explicar con sus palabras, cambien la decisión o la respuesta antes de presentar: ese es el filtro que usa el profesor.

## Guion de 7 minutos (reparto sugerido para la dupla)

| Min | Quién | Qué | Evidencia en vivo |
| --- | --- | --- | --- |
| 0:00–1:30 | Persona A | Dominio, usuarios, restricciones (Ley 1098, Ley 1581, Supabase, red incierta). Los 3 drivers y **de dónde salió cada uno** | Árbol de utilidad: solo una hoja (A,A) |
| 1:30–3:00 | Persona B | Estilo elegido, las 3 alternativas descartadas y qué se sacrifica | Tabla «Estilo elegido» + C4 nivel 2 |
| 3:00–6:00 | Persona C | Demo: `mvn spring-boot:run`, los 5 pasos, presupuesto 250.000, `mvn test` | Pasos 2, 3 y 4 son los que prueban E1 |
| 6:00–7:00 | Todos | ADR-002 y ADR-003: consecuencias malas y riesgo principal (R1/R2) | Tabla de riesgos |

Demo, en orden: abrir <http://localhost:8090>, pulsar los pasos 1 a 5 y luego «Consultar presupuesto» (debe dar `comprometido: 250000`). Después `mvn test`. Para impactar: comentar `agenda.bloquearAgendas(...)` en `ProgramarEscena.java`, correr `mvn test` y mostrar que la prueba de 8 hilos falla (aceptó varias de 8; 4 y 6 en nuestras corridas). Restaurar la línea después.

## Pregunta 1: ¿Qué driver justifica esta decisión y de dónde salió?

- **Integridad de la agenda.** Salió de leer el backend actual: `SceneServiceImpl.createScene` valida y luego guarda sin bloqueo, así que dos solicitudes simultáneas pueden pasar. Es un defecto observado, no una suposición. Una cita doble puede detener un día de rodaje.
- **Modificabilidad.** Salió de la Ley 1098 (límites para menores) y de que las reglas cambian por tipo de producción. El origen es normativo.
- **Disponibilidad en locación.** Es la más débil: es una hipótesis que no validamos con un equipo de rodaje real. Díganlo así, la tabla ya lo dice («Hipótesis por validar»).
- Por qué solo una hoja (A,A): el resto de lo importante es fácil de lograr (A,B) o difícil pero poco importante (B,A). Eso es priorizar.

## Pregunta 2: ¿Qué alternativa descartaron y por qué?

| Decisión | Alternativa | Razón en una frase |
| --- | --- | --- |
| Estilo | Microservicios | Validar y guardar una cita pasaría a ser coordinación distribuida; el volumen no lo justifica y somos tres |
| Estilo | Eventos con bróker | Quien programa necesita respuesta síncrona (409); el bróker no ayuda al driver 1 |
| Estilo | Capas sin módulos | Nada impide que Presupuesto toque tablas de escenas; falla E2 |
| Concurrencia | Optimista por versión | Genera reintentos justo en la reprogramación masiva, cuando hay más contención |
| Concurrencia | `EXCLUDE` de PostgreSQL | Evita el solape pero no expresa la advertencia de traslado ni límites semanales |
| Concurrencia | `SERIALIZABLE` | Correcto pero fuerza reintentar toda la operación |
| Evento | Outbox asíncrono | Es la evolución prevista, pero agrega consistencia eventual y un proceso sin necesidad actual |
| Evento | Llamada directa | Acopla Planificación a Presupuesto |

## Pregunta 3: ¿Qué atributo empeoró y por qué es aceptable?

- **Escalabilidad/despliegue independiente** (monolito): aceptable porque ninguna métrica pide escalar un módulo solo, y la hoja de despliegue es (B,A): poco importante hoy.
- **Rendimiento de escritura por actor** (bloqueo): se serializan las escrituras del mismo actor. Aceptable: una persona no puede estar en dos sitios; el costo es real solo cuando hay contención real, y solo compiten escenas que comparten actor.
- **Disponibilidad** (evento en la misma transacción): si Presupuesto falla, no se puede programar. Aceptable porque una escena sin dinero comprometido es peor que una escena rechazada. Salida: outbox.
- **Mantenibilidad inmediata** (más archivos e indirección por contratos): el costo de pagar E2.

## Pregunta 4: ¿Si el negocio creciera 10 veces, qué se rompe primero?

Hipótesis del documento: el **pool de conexiones** (cada programación retiene una mientras espera bloqueos), después la **contención en la fila de presupuesto** de una producción (ADR-003), y luego la auditoría de conflictos O(n²). Respuesta de evolución: outbox para Presupuesto, más instancias de la API, auditoría por día. Es una hipótesis: R2 dice cómo comprobarla (prueba de carga). No la presenten como un hecho.

## Preguntas trampa probables

1. **«¿Esto es un monolito? ¿Dónde están los servicios?»** No hay servicios, y es deliberado. La estructura demostrada son módulos y capas; la prueba ArchUnit lo verifica. Si el diseño dijera microservicios, sí sería incoherente.
2. **«¿Cómo sé que las capas no tienen atajos?»** `ReglasDeArquitecturaTest` falla ante una violación, y además prueba que la regla detecta un atajo plantado (`PlantaDeAtajo`, `AtajoPlantado`), para que no pase vacía.
3. **«¿Por qué H2 si dicen Supabase?»** Para arrancar con un comando. Está declarado como diferencia y como riesgo R1. Ya se probó la concurrencia en PostgreSQL 16 en Docker (1 de 8 aceptada), pero falta Supabase con su pooler. Digan eso, ni más ni menos.
4. **«¿Por qué aceptan una advertencia explícita?»** El traslado menor a 45 min es una regla de negocio blanda; el solape es dura. Lo decide el director con conocimiento.
5. **«¿Qué pasa si la tabla de presupuesto se bloquea?»** Ver pregunta 4 y la consecuencia mala de ADR-003.
6. **«¿Dónde está el control de roles/JWT?»** Fuera del alcance del esqueleto (dicho en el README). E4 está como táctica «Planificada».
7. **«¿El tope de 14 horas para menores?»** No está confirmado en el texto oficial (R5). No lo codificamos por eso.

## Antes de sustentar: checklist

- [ ] Cada integrante puede explicar los tres ADR sin mirar.
- [ ] Probaron `mvn spring-boot:run` en el computador que llevarán, con Java 17+ y Maven 3.9+.
- [ ] Puerto 8090 libre; reiniciar la app antes de la demo (los datos están en memoria).
- [ ] Diseño abierto en `arquitectura/docs/diseno.html`.
- [ ] Completaron `propuesta.md` con los datos de la dupla.
- [ ] Ensayaron los 7 minutos con cronómetro.
