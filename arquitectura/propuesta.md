# Propuesta de dominio: texto para el formulario

Integrantes (dupla, grupo 5A): Andres Felipe Benavides Bolaños y Miguel Alberto Santacruz. Si el formulario exige tres integrantes, consulten con el profesor cómo registrar una dupla.

## 1. ¿Qué dominio eligieron?

StudioFlow, un sistema para planificar producciones audiovisuales (películas, series, videoclips y documentales). Una productora lo usa para programar escenas por fecha, hora y locación, citar actores, publicar el llamado de cada día y controlar el presupuesto comprometido en cada producción.

## 2. ¿Qué lo hace complejo?

Reglas de negocio: un actor no puede estar citado en dos escenas que se solapen, aunque sean de producciones distintas, y esa escena se rechaza. Si tiene dos escenas el mismo día en locaciones distintas con menos de 45 minutos de margen, el sistema advierte y solo permite guardar si el usuario lo acepta de forma explícita. Cada escena programada compromete presupuesto, y las reprogramaciones simultáneas no pueden romper estas reglas.

Usuarios: productor (producciones y presupuesto), director (programa y resuelve conflictos), equipo técnico (consulta el llamado) y actor (consulta solo su agenda).

Restricciones externas: la Ley 1098 de 2006, art. 35, sobre autorización para que menores de 15 años realicen actividades artísticas; la Ley 1581 de 2012 sobre datos personales del reparto; la integración con PostgreSQL gestionado en Supabase; y la operación en locaciones con conectividad incierta.

## 3. Sus tres drivers principales

1. Integridad de la agenda: dos programaciones simultáneas nunca deben citar dos veces a la misma persona, porque una cita imposible puede detener un día de rodaje, que es el mayor costo de la operación.
2. Modificabilidad de las reglas: las reglas de programación cambian por norma y por tipo de producción, y agregar una no debe afectar áreas como presupuesto.
3. Disponibilidad del llamado en locación: el equipo necesita consultar el llamado del día incluso con red intermitente, porque de él depende que llegue a tiempo y al lugar correcto.
