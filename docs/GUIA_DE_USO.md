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
  - Si tu sede tiene **control de ubicación**, debajo del botón dice "Al marcar se verifica que estés en …". Al tocarlo, la app pide tu ubicación (la primera vez el celular pregunta si la permites: elige **Permitir**). Si estás lejos, avisa a qué distancia estás y no registra nada.
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
- Los días de trabajo en los que **no marcaste nada** ("Ausente") también tienen **"Justificar"**: para explicar la falta (por ejemplo, una cita médica) o, si **viniste pero olvidaste marcar**, para escribir a qué hora entraste y saliste; tu jefe las registra al aprobar. Solo se puede en días que ya pasaron. Si el jefe la aprueba, el día pasa a **"Ausencia justificada"** y deja de contar como ausencia.

### 3. Solicitudes

**Es el buzón de tus notas al jefe.** Aquí ves las justificaciones que enviaste: **Pendiente**, **Aprobada** o **Rechazada**, con la respuesta del jefe. Cuando el jefe responde, te llega un aviso al instante.

---

## Pantallas del supervisor y el administrador (computadora)

El menú de la izquierda está **en el orden en que se prepara el sistema**:

**Configuración → 1 Sedes, 2 Turnos, 3 Horarios, 4 Empleados.**
Después, el día a día: **Justificaciones**, **Feriados y permisos** y **Reportes**.

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
- **Control de ubicación (opcional)**: al editar una sede se puede indicar su ubicación (latitud, longitud) y un radio, por ejemplo 150 m. Desde ahí, los empleados que trabajan ese día en esa sede solo pueden marcar si su celular está dentro de ese radio. La ubicación se obtiene con **"Usar mi ubicación actual"** (estando en la sede) o copiándola de Google Maps (mantener presionado sobre el lugar). **"Ver en el mapa"** permite revisarla. Si se deja vacía, se marca desde cualquier lugar, como antes.
- Solo el administrador crea, edita y **elimina** sedes. Una sede no se puede eliminar si es la sede base de algún empleado (primero se cambian de sede) ni si ya tiene marcaciones o traslados: en ese caso se desactiva.

### 2. Turnos

**Son los bloques de horario**, como las piezas de un rompecabezas: "Mañana 08:00–18:00", "Tarde 11:00–21:00".

- Cada turno tiene una **tolerancia**: los minutos de gracia antes de contar atraso. Con tolerancia de 10 minutos, llegar 08:10 no es atraso; llegar 08:11 sí, y se cuentan 11 minutos.
- Si alguien llega **antes** de su hora de entrada, esos minutos quedan como **preingreso**: se ven en el dashboard, el historial y los reportes, pero **no suman horas**. Las horas se cuentan desde la hora de entrada del turno.
- La columna "Usado en" dice qué horarios usan cada turno. Un turno solo se puede **eliminar** si ningún horario lo usa.

### 3. Horarios

**Es el calendario de la semana**, armado con las piezas de los turnos.

- Ejemplo, "Rotación A": lunes Mañana, martes Tarde, miércoles Mañana… domingo Libre.
- Se ve como una tira de 7 días con colores.
- **"Asignar a empleados"**: eliges el horario, desde qué fecha y por cuánto tiempo (1, 3 o 6 meses), y marcas a las personas. Si alguien ya tenía otro horario, el anterior **termina solo** el día anterior. Así funcionan las **rotaciones cada 3 meses**.
- **"Ver asignados"**: muestra quién tiene ese horario hoy o más adelante. Se pueden marcar varias personas y pulsar **"Quitar del horario"**: si la asignación empieza hoy o más adelante, se borra; si ya venía de antes, la conserva hasta hoy y desde mañana queda sin ese horario. Las marcaciones no se tocan.
  - Antes de confirmar, la app muestra cómo queda cada persona, por ejemplo "Quedará sin horario desde el 16/11". Si tenía **otro horario justo antes** (el que se recortó al asignarle este), aparece la opción **"Volver a su horario anterior"**, marcada por defecto: vuelve a ese horario en las mismas fechas que tenía, sin dejar días vacíos. Lo mismo ocurre con **"Quitar"** en el historial de horarios de un empleado.
- Un horario solo se puede **eliminar** si nunca se asignó. Si tiene personas asignadas, primero se quitan; si ya se usó en el pasado, se desactiva.
- **Rotaciones por terminar**: un aviso amarillo con quiénes terminan su horario pronto y aún no tienen el siguiente, con un botón para asignarlo de una vez.

### 4. Empleados

**Es la lista del equipo.**

- Para crear a alguien: nombre, correo, cédula, cargo, **sede** y una contraseña inicial que se le entrega al trabajador.
  - **Cédula**: debe ser una cédula ecuatoriana real de 10 dígitos. Solo acepta números, no deja escribir más de 10 y revisa el dígito verificador, así detecta un número mal tipeado. Si se pega con guiones o espacios, se limpian solos.
  - **Correo**: debe tener la forma nombre@empresa.com (con dominio y extensión), hasta 100 caracteres.
  - **Contraseña**: de 8 a 15 caracteres, sin espacios al inicio ni al final. Se escribe dos veces y un contador muestra cuántos caracteres lleva.
- La columna **Horario** muestra qué horario sigue y hasta cuándo. Al hacer clic se ve su historial de horarios.
- **Activo / Inactivo**: un empleado inactivo ya no puede entrar ni marcar.
- **Eliminar**: solo para quien se creó por error. No se puede si tiene un horario asignado (primero se quita) ni si ya tiene marcaciones o historial: en ese caso se desactiva, para no perder su asistencia. Al eliminarlo también se borra su usuario de acceso.
- Los supervisores solo pueden mirar; el administrador edita.

### Justificaciones

**Es la bandeja de las notas de los empleados.** Por ejemplo: "llegué tarde porque tuve una cita médica".

- Pestañas: Pendientes, Aprobadas, Rechazadas y Todas.
- Cada nota muestra quién la envió, qué marcación quiere justificar y el motivo.
- **Aprobar** o **Rechazar**, con una nota opcional. El empleado recibe la respuesta al instante en su celular.
- Una nota puede ser de una marcación (por ejemplo, un ingreso con atraso) o de una **ausencia** (un día de trabajo sin marcas).
- **Si apruebas la justificación de una ausencia**, la app pregunta **"¿Trabajó ese día?"**:
  - **No trabajó (permiso):** deja de contar como ausencia y aparece como "Ausencia justificada" (en verde), sin horas. En el Excel tiene su propia columna, "Ausencias justificadas".
  - **Sí trabajó, olvidó marcar:** escribes la hora de **ingreso** y de **salida** (vienen puestas las del turno). Se registran como **"registradas por el jefe"** (con \* en Reportes y Excel), el día cuenta como **trabajado** con sus horas, y si el ingreso es después de la tolerancia queda con su **atraso**, igual que si hubiera marcado. Si el turno es de noche, una salida menor que el ingreso es del día siguiente.
- **Olvidó marcar la salida:** si la justificación es de un ingreso que quedó sin salida y **ya pasó la hora de salida de su turno** (mientras la jornada sigue en curso no aparece, porque todavía puede marcarla), al aprobarla aparece **"Registrar la salida que olvidó marcar"** con la hora de salida del turno ya puesta (se puede cambiar). La app muestra cuántas horas quedarán. La salida queda como **"registrada por el jefe"** (con un asterisco \* en Reportes y en el Excel) y esas horas **sí cuentan**. No puede ser antes del ingreso, en el futuro, después de su siguiente marcación ni de más de una jornada; si el turno es de noche y la hora es menor que la del ingreso, se toma el día siguiente.
- **Si apruebas la justificación de un ingreso con atraso, ese atraso deja de contar**: no suma a los días ni a los minutos de atraso del reporte ni del Excel. Igual queda a la vista como "Atraso … justificado" (en verde), para que se sepa qué pasó. Rechazar o dejarla pendiente no cambia nada.
- **Llegó a tiempo pero marcó tarde** (por ejemplo, atendió a un cliente antes de marcar): al aprobar un ingreso **que quedó con atraso** aparece **"Contar las horas desde la hora real de llegada"** (marcada por defecto; si llegó a tiempo no aparece), con la hora de inicio del turno ya puesta. La marca original **no cambia**; solo las horas se cuentan desde esa hora, así que se suman los minutos que faltaban. En Reportes se ve "E 08:13 (cuenta desde 08:00)". No puede ser antes del inicio del turno ni después de la hora en que marcó.
- **Deshacer una decisión** (solo el administrador): en una justificación aprobada o rechazada, **"Deshacer decisión"** la devuelve a **Pendiente** y revierte lo que hizo la aprobación: borra las marcaciones que registró el jefe y quita el ajuste de hora de llegada. El atraso o la ausencia vuelven a contar hasta que se decida otra vez. Queda en la auditoría y el empleado recibe un aviso. No se puede si una de esas marcaciones del jefe tiene su propia justificación: primero hay que resolver esa.

### Feriados y permisos

**Es el calendario de los días que no se trabaja.** Esos días no cuentan como ausencia ni como días programados, y si alguien igual marca, no se le cuenta atraso.

- **Feriados** (solo el administrador los agrega o quita): valen para todos. Se elige la fecha y el nombre, por ejemplo "Día del Trabajo". Si alguien trabaja un feriado, esas horas cuentan como **suplementarias**, igual que en su día de descanso.
- **Vacaciones y permisos** (administrador o supervisor): para uno o varios empleados, con tipo (**Vacaciones**, **Permiso médico** o **Permiso personal**), fechas y una nota opcional. Se pueden registrar fechas pasadas, por ejemplo un permiso médico de la semana anterior.
  - **"Cancelar"** borra uno que aún no empieza. **"Terminar ahora"** acorta uno en curso: desde hoy la persona vuelve a trabajar normal. Los que ya terminaron no se tocan.
- En el **Dashboard** esas personas aparecen con la etiqueta del feriado o permiso y no cuentan como "Sin marcar". En el celular del empleado aparece "Hoy es feriado" o "Hoy estás de vacaciones".

### Reportes

**Es la libreta de calificaciones de la asistencia.**

- Se elige un rango de fechas (hay atajos: Hoy, Últimos 7 días, Este mes, Mes anterior), una sede y un empleado.
- Totales: horas trabajadas, días trabajados sobre los programados, **ausencias**, días con atraso y minutos de atraso. Los atrasos justificados no suman, y debajo de "Días con atraso" se indica cuántos hubo (por ejemplo "+1 justificado").
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

**Eliminar** un usuario es solo para quien se creó por error: pierde el acceso al instante. No se puede eliminar a uno mismo, ni a quien ya hizo cambios en el sistema (revisó justificaciones, registró traslados o editó datos): en ese caso se **desactiva**, para conservar el registro de quién hizo qué.

### Auditoría (solo el administrador)

**Es el libro de registro.** Cada cambio que alguien hace en el panel queda anotado: quién lo hizo, cuándo, qué hizo (creó, editó, eliminó, aprobó, asignó…) y sobre qué registro.

- Se puede filtrar por **sección** (sedes, empleados, horarios, justificaciones, feriados…), por **usuario** y por **fechas**. Muestra los 50 más recientes; **"Cargar más"** trae los anteriores.
- **"Ver"** abre el detalle con los valores de **antes y después**; las filas resaltadas son las que cambiaron.
- Es solo lectura: nadie puede editar ni borrar estos registros. Las contraseñas nunca se muestran.

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

**Un empleado dice que está en la sede pero la app no lo deja marcar. ¿Qué reviso?**
El mensaje dice qué pasó:

- **"Necesitamos tu ubicación"** o **"Bloqueaste el permiso de ubicación"**: hay que permitir la ubicación al navegador para el sitio de SAMY (ícono del candado junto a la dirección) y tener el GPS del celular encendido.
- **"Tu ubicación es muy imprecisa"**: el celular no logra ubicarse bien (pasa en sótanos o lejos de ventanas). Activar el GPS o acercarse a una ventana.
- **"Estás a … de la sede"**: revisa en **Sedes › Editar** que la ubicación de la sede sea la correcta (**"Ver en el mapa"**) o amplía el radio.

Para cada marcación se guarda la ubicación enviada y su distancia a la sede.

**¿Cuándo se cuenta una ausencia?**
Cuando un día de trabajo **ya pasó** y la persona no marcó nada. El día de hoy nunca cuenta como ausencia mientras no termine. Si el empleado justifica la falta y el jefe la aprueba, deja de contar como ausencia: queda como "Ausencia justificada", sin horas trabajadas.

**¿Cómo cambio mi contraseña?**
Cualquier usuario (empleado, supervisor o administrador) puede cambiarla por su cuenta:

- **Empleado**: toca el ícono de la llave 🔑 arriba, junto a "Salir".
- **Administrador o supervisor**: en el panel izquierdo, debajo de tu correo, elige **"Cambiar contraseña"** (en el celular, el ícono de la llave arriba).

Pide la contraseña actual y la nueva dos veces (de 8 a 15 caracteres, distinta de la actual). La sesión en ese dispositivo sigue abierta, y **se cierran las sesiones abiertas en otros dispositivos** (por si alguien más la conocía). Si se equivoca 5 veces con la contraseña actual, se bloquea 15 minutos, igual que en el ingreso.

**Olvidé mi contraseña. ¿Cómo la recupero?**
En la pantalla de ingreso, toca **"¿Olvidaste tu contraseña?"** y escribe tu correo. Te llega un correo con el botón **"Crear nueva contraseña"**: el enlace vale **30 minutos** y sirve **una sola vez**. Al guardarla se cierran las sesiones que tenías abiertas en otros dispositivos.

- Si no llega, revisa la carpeta de spam. Se pueden pedir hasta 3 correos por hora.
- Por seguridad, la app responde lo mismo aunque el correo no esté registrado.
- Si la persona ya no tiene acceso a su correo, un administrador puede ponerle una contraseña nueva desde **Empleados** o **Usuarios** (eso también cierra sus sesiones abiertas).

**Creé un empleado y no puede entrar con su contraseña. ¿Qué reviso?**
La contraseña se guarda tal cual se escribe (de 8 a 15 caracteres), y respeta mayúsculas y minúsculas. Al crearla hay que escribirla dos veces; con el ícono del ojo 👁 se puede ver lo escrito, y "Generar una contraseña" crea una fácil de dictar (por ejemplo "Kmrt-4827"). En el ingreso, la app avisa si Bloq Mayús está activado.

**Me sale "Demasiados intentos fallidos". ¿Qué hago?**
Después de **5 contraseñas incorrectas** seguidas con el mismo correo, el ingreso se bloquea **15 minutos** para ese correo, incluso con la contraseña correcta. Es una protección contra quien intenta adivinar contraseñas. Cuando quedan 2 intentos, la app avisa. Basta con esperar; si la persona olvidó su contraseña, un administrador puede ponerle una nueva desde **Empleados** o **Usuarios** (el bloqueo igual dura hasta que pasen los 15 minutos).

**¿La sesión se cierra sola?**
Sí, por seguridad:

- **Por inactividad**: 30 minutos sin usar la app para administradores y supervisores, y 10 minutos para empleados. Un minuto antes aparece el aviso "¿Sigues ahí?" con el botón "Seguir conectado".
- **Por tiempo máximo**: 8 horas después de iniciar sesión, aunque se esté usando.

Si la pantalla del dashboard se deja abierta como tablero, también se cerrará por inactividad. Los tiempos se pueden cambiar en la configuración del servidor.

**¿Se puede instalar como una app?**
Sí. En el celular, abre la página y elige **"Agregar a pantalla de inicio"**. Queda con el ícono de SAMY, como cualquier app.

**¿Quién ve qué?**
El empleado solo ve lo suyo. Los jefes ven a todos. Cada cambio que hace un jefe (aprobaciones, ediciones, traslados) queda guardado en un registro interno con quién lo hizo y cuándo.
