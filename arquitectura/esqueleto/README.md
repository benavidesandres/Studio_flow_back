# StudioFlow: esqueleto funcional

Implementación mínima, de punta a punta, del monolito modular descrito en `../docs/diseno.html`.

## Requisitos

Java 17 o superior y Maven 3.9 o superior. No hace falta base de datos: usa H2 en memoria, en modo PostgreSQL.

## Arrancar

Desde esta carpeta:

```bash
mvn spring-boot:run
```

Abre <http://localhost:8090> y ejecuta los pasos en orden. Para repetir la demostración, reinicia la aplicación.

| Paso | Qué demuestra | Respuesta |
| --- | --- | --- |
| 1. Programar SC-1 | Recorrido web → aplicación → dominio → base de datos | 201 |
| 2. Solapar SC-2 | Regla bloqueante | 409 `SOLAPAMIENTO` |
| 3. SC-3 con 30 min de traslado | Advertencia sin aceptar | 409 `TRASLADO_INSUFICIENTE` |
| 4. Repetir SC-3 aceptando | Advertencia aceptada de forma explícita | 201 con advertencia |
| 5. Citar a una técnica como actor | Consulta a Reparto por su contrato | 400 |
| Consultar presupuesto | El evento llegó a Presupuesto y los rechazos no sumaron | Comprometido: 250.000 |

## Verificar la estructura

```bash
mvn test
```

- `ReglasDeArquitecturaTest`: capas en una sola dirección, módulos conectados solo por `contrato`, sin ciclos. También comprueba que la regla detecta un atajo plantado a propósito.
- `FlujoDeProgramacionTest`: reglas de conflicto, consistencia con el presupuesto y 8 programaciones simultáneas de las que solo una se acepta.

Para ver fallar la concurrencia en vivo, comenta `agenda.bloquearAgendas(...)` en `ProgramarEscena` y ejecuta `mvn test`.

## Estructura

```
com.studioflow
├── planificacion   Escenas, agenda y conflictos
├── reparto         Personas y roles
└── presupuesto     Dinero comprometido

Cada módulo: web → aplicacion → dominio ← infraestructura
Entre módulos: únicamente por el paquete contrato
```

## Probar contra PostgreSQL real (riesgo R1)

```bash
docker run -d --name sf-pg -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=studioflow -p 15432:5432 postgres:16-alpine
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15432/studioflow SPRING_DATASOURCE_USERNAME=postgres SPRING_DATASOURCE_PASSWORD=pg mvn spring-boot:run
```

Con 8 solicitudes simultáneas sobre el mismo actor y franja se acepta 1 y las otras 7 reciben 409.

## Diferencias frente al diseño

El esqueleto usa H2 en lugar de PostgreSQL en Supabase y una página de demostración en lugar de la aplicación React. No incluye JWT ni roles.
