# SAMY Asistencia: guía de uso

> Explicada de forma sencilla, pantalla por pantalla, para que cualquier persona la entienda.

## La idea en una frase

**SAMY es un reloj de entrada y salida que vive en el celular.** El trabajador toca un botón al llegar y otro al irse. El jefe ve en su computadora, en ese mismo momento, quién llegó, quién no y quién llegó tarde.

Piénsalo como **la lista de asistencia de una escuela**, pero:

- el alumno se anota solo, con su celular;
- la hora la pone el reloj de la escuela (no el del alumno, así nadie hace trampa);
- la maestra ve la lista actualizarse sola, sin recargar nada.

## Quién usa qué

| Persona           | Qué hace                                                                                 | Dónde       |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------- |
| **Empleado**      | Marca su entrada y salida, ve su historial y pide correcciones                           | Celular     |
| **Supervisor**    | Mira la asistencia en vivo, aprueba correcciones, saca reportes y registra traslados     | Computadora |
| **Administrador** | Todo lo del supervisor, y además configura sedes, turnos, horarios, empleados y usuarios | Computadora |

---

## Pantallas de todos

### Entrar (iniciar sesión)

**Es la puerta de la casa.** Cada persona tiene su llave: su correo y su contraseña. Según quién entre, la app lo lleva a su lugar: el empleado al botón de marcar y el jefe al panel.

### Configuración inicial (solo la primera vez)

**Es cuando te mudas a una casa nueva y haces la primera llave.** Si el sistema está recién instalado y no hay ningún administrador, en lugar de "Entrar" aparece este formulario para crear al primer administrador. Apenas se crea, **desaparece para siempre**, así nadie más puede usarlo.

### Apariencia: claro, oscuro o sistema

**Es como prender o apagar la luz del cuarto.** Con el ícono del sol o la luna se elige si la app se ve clara u oscura. En "Sistema" copia lo que tenga el celular o la computadora.

### "En vivo"

El puntito verde arriba a la derecha dice **"En vivo"**: la app está conectada y todo se actualiza solo. Si se pone rojo, se perdió la conexión; cuando vuelve, la app se pone al día sola.

---

## Pantallas del empleado (celular)

### 1. Marcar

**Es el timbre de la entrada.**

- Un **botón redondo grande**: azul dice **"Marcar ingreso"**; cuando ya entraste, se vuelve negro y dice **"Marcar salida"**.
  - La app sabe sola si toca entrada o salida. No te puedes equivocar marcando dos entradas seguidas.
  - Al tocarlo aparece un ✓ con "Ingreso registrado".
- **"Tu turno de hoy"**: a qué hora te toca entrar hoy, por ejemplo "Tarde · 11:00–21:00", o si hoy es tu **día de descanso**.
- **Dónde trabajas hoy**: tu sede. Si el jefe te mandó a otra por un día, dice "Hoy trabajas en Sede Norte (traslado temporal)".
- **Estado actual**: si estás Dentro o Fuera, tu última marcación y cuántas horas llevas hoy (el contador avanza solo).
- **Mi semana**: qué turno te toca cada día, de lunes a domingo.

> 🕐 **La hora no la pone el celular, la pone el servidor.** Aunque alguien cambie la hora de su teléfono, la marcación queda con la hora real.

### 2. Historial

**Es tu cuaderno de asistencia del mes.**

- Arriba: horas trabajadas, días trabajados, atrasos y **ausencias**.
- Cada día muestra qué turno tenías, a qué hora entraste y saliste, y etiquetas como "Atraso 14 min", "Ausente" o "Jornada abierta" (cuando olvidaste marcar la salida).
- Cada marcación tiene el botón **"Justificar"** para explicar qué pasó.

### 3. Solicitudes

**Es el buzón de tus notas al jefe.** Aquí ves las justificaciones que enviaste: **Pendiente**, **Aprobada** o **Rechazada**, con la respuesta del jefe. Cuando el jefe responde, te llega un aviso al instante.

---

## Pantallas del supervisor y el administrador (computadora)

El menú de la izquierda está **en el orden en que se prepara el sistema**:

**Configuración → 1 Sedes, 2 Turnos, 3 Horarios, 4 Empleados.**
Después, el día a día: **Justificaciones** y **Reportes**.

Es como **armar un equipo de fútbol**: primero la cancha (sedes), luego los horarios de entrenamiento (turnos), luego el calendario de la semana (horarios), después los jugadores (empleados), y al final le dices a cada jugador qué calendario sigue.

### Dashboard (la pantalla principal)

**Es el tablero del estadio: muestra el partido en vivo.**

- **Primeros pasos** (solo el administrador, mientras falte algo): una lista de 5 pasos con check ✓ en los completados y un botón para ir al siguiente. Cuando todo está listo, desaparece.
- **Contadores**: Empleados, Dentro, Fuera, Sin marcar, Con atraso y Descansan hoy. Al tocar uno, la tabla muestra solo esos.
- **Filtro de sede**, para ver una sola sede.
- **Tabla**: cada persona con la sede donde está hoy, su turno de hoy, su estado ("Dentro", "No ha llegado", "Descanso", "Atraso 1 h 05 min"), la hora de ingreso y las horas trabajadas.
- **Actividad en vivo**: cada vez que alguien marca, aparece aquí y su fila se ilumina un momento.
- Avisos, por ejemplo cuando hay rotaciones que terminan pronto o empleados sin horario.

### 1. Sedes

**Son las casas de la empresa** (por ejemplo, Sede Centro y Sede Norte).

- Cada sede muestra cuántos empleados tiene y cuántos llegan hoy prestados de otra sede.
- **Traslados**: cuando por una emergencia o una orden alguien debe trabajar en otra sede, el jefe pulsa **"Registrar traslado"** y elige la sede de destino, las fechas (hay botones rápidos: "Solo hoy", "3 días", "1 semana"), el motivo y las personas.
  - **El empleado no tiene que hacer nada**: marca normal y su marcación queda en la otra sede.
  - Al terminar las fechas vuelve solo a su sede. Si la emergencia acaba antes, se pulsa **"Terminar ahora"**.
- Solo el administrador crea y edita sedes. Una sede con historial no se borra, solo se desactiva.

### 2. Turnos

**Son los bloques de horario**, como las piezas de un rompecabezas: "Mañana 08:00–18:00", "Tarde 11:00–21:00".

- Cada turno tiene una **tolerancia**: los minutos de gracia antes de contar atraso. Con tolerancia de 10 minutos, llegar 08:10 no es atraso; llegar 08:11 sí, y se cuentan 11 minutos.
- Si alguien llega **antes** de su hora de entrada, esos minutos quedan como **preingreso**: se ven en el dashboard, el historial y los reportes, pero **no suman horas**. Las horas se cuentan desde la hora de entrada del turno.
- La columna "Usado en" dice qué horarios usan cada turno.

### 3. Horarios

**Es el calendario de la semana**, armado con las piezas de los turnos.

- Ejemplo, "Rotación A": lunes Mañana, martes Tarde, miércoles Mañana… domingo Libre.
- Se ve como una tira de 7 días con colores.
- **"Asignar a empleados"**: eliges el horario, desde qué fecha y por cuánto tiempo (1, 3 o 6 meses), y marcas a las personas. Si alguien ya tenía otro horario, el anterior **termina solo** el día anterior. Así funcionan las **rotaciones cada 3 meses**.
- **Rotaciones por terminar**: un aviso amarillo con quiénes terminan su horario pronto y aún no tienen el siguiente, con un botón para asignarlo de una vez.

### 4. Empleados

**Es la lista del equipo.**

- Para crear a alguien: nombre, correo, cédula, cargo, **sede** y una contraseña inicial que se le entrega al trabajador.
- La columna **Horario** muestra qué horario sigue y hasta cuándo. Al hacer clic se ve su historial de horarios.
- **Activo / Inactivo**: un empleado inactivo ya no puede entrar ni marcar. No se borra, para no perder su historial.
- Los supervisores solo pueden mirar; el administrador edita.

### Justificaciones

**Es la bandeja de las notas de los empleados.** Por ejemplo: "llegué tarde porque tuve una cita médica".

- Pestañas: Pendientes, Aprobadas, Rechazadas y Todas.
- Cada nota muestra quién la envió, qué marcación quiere justificar y el motivo.
- **Aprobar** o **Rechazar**, con una nota opcional. El empleado recibe la respuesta al instante en su celular.

### Reportes

**Es la libreta de calificaciones de la asistencia.**

- Se elige un rango de fechas (hay atajos: Hoy, Últimos 7 días, Este mes, Mes anterior), una sede y un empleado.
- Totales: horas trabajadas, días trabajados sobre los programados, **ausencias**, días con atraso y minutos de atraso.
- Por persona: "Ver días" muestra cada día con su sede, el turno que le tocaba, la entrada, la salida y las horas.
- **"Exportar mes a Excel"**: se elige el mes y se descarga un archivo con:
  - **Resumen**: una fila por colaborador con sus totales del mes. El nombre lleva a su hoja.
  - **Una hoja por colaborador**, con todos los días del mes hasta hoy: turno, ingreso, salida, horas trabajadas, atraso y horas suplementarias (en horas:minutos), más una observación ("No marcó", "Descanso", "Preingreso 5 min"…). Los días que no marcó aparecen con 0.
- **Horas suplementarias**: el tiempo trabajado después de la hora de salida del turno. En un día de descanso, todo lo trabajado cuenta como suplementario.

### Usuarios (solo el administrador)

**Son las llaves de los jefes.** Aquí se crean otros administradores y supervisores, y se cambian contraseñas.

| Rol               | Puede                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** | Todo                                                                                                                                          |
| **Supervisor**    | Ver el dashboard, aprobar justificaciones, sacar reportes y registrar traslados. Ve sedes, turnos, horarios y empleados, pero no los modifica |

Nadie puede quitarse su propio permiso ni desactivarse a sí mismo, y siempre queda al menos un administrador.

---

## Preguntas frecuentes

**¿Qué pasa si un trabajador olvida marcar la salida?**
Ese día queda como "Jornada abierta" y no suma horas. Al día siguiente su botón vuelve a decir "Marcar ingreso". Puede enviar una justificación para que el jefe lo revise.

**¿Qué pasa si llega antes de su hora de entrada?**
Se registra la hora real en que marcó, pero sus horas se cuentan **desde la hora de entrada del turno**. Los minutos de antes quedan como **preingreso** y no suman horas. Por ejemplo, con turno de 08:00 a 18:00:

| Marca a las | En el reporte                           | Horas que suma (si sale 18:00) |
| ----------- | --------------------------------------- | ------------------------------ |
| 07:50       | Ingreso 08:00 · Preingreso 10 min       | 10 h                           |
| 08:00       | Ingreso 08:00                           | 10 h                           |
| 08:10       | Ingreso 08:10 (dentro de la tolerancia) | 9 h 50 min                     |
| 08:11       | Ingreso 08:11 · Atraso 11 min           | 9 h 49 min                     |

La hora real de la marcación se sigue viendo en el detalle de marcaciones y en la hoja "Marcaciones" del Excel.

**¿Qué pasa si marca en su día de descanso?**
Se registra normalmente y no cuenta como atraso.

**¿Cuándo se cuenta una ausencia?**
Cuando un día de trabajo **ya pasó** y la persona no marcó nada. El día de hoy nunca cuenta como ausencia mientras no termine.

**¿Se puede instalar como una app?**
Sí. En el celular, abre la página y elige **"Agregar a pantalla de inicio"**. Queda con el ícono de SAMY, como cualquier app.

**¿Quién ve qué?**
El empleado solo ve lo suyo. Los jefes ven a todos. Cada cambio que hace un jefe (aprobaciones, ediciones, traslados) queda guardado en un registro interno con quién lo hizo y cuándo.
