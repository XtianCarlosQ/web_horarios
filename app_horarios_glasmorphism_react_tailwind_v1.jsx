import React, { useMemo, useState } from "react";

/**
 * App Horarios – Glasmorphism
 *
 * • Panel 1: Configuración in‑line por curso (checkbox, color picker, nombre, inicio/horas, y resumen de horarios)
 * • Panel 2: Horario semanal con cards de eventos (glasmorphism oscuro + hover tilt)
 * • Reglas UX clave:
 *   - Si un card se hace click, trae el evento al frente (z-index alto)
 *   - Si hay cruce, los cards se desplazan levemente a la derecha para distinguirse
 *   - Si hay cruce 100% (mismo rango), se muestra overlay holográfico claro
 *
 * Nota: Este archivo es autosuficiente. Tailwind debe estar habilitado en el entorno.
 */

// --- Utilidades de tiempo ---
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; // (dom no usado)
const DAY_KEY = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

function toMinutes(t) {
  // "18:00" -> 1080
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmt12h(t) {
  const [hh, mm] = t.split(":").map(Number);
  const suffix = hh >= 12 ? "pm" : "am";
  const h = ((hh + 11) % 12) + 1;
  return `${h}:${mm.toString().padStart(2, "0")} ${suffix}`;
}

// --- Datos de ejemplo tomados de tus pantallazos ---
const initialCourses = [
  {
    id: "excel-macros",
    name: "Excel con Macros + IA",
    color: "#7bdcf7",
    enabled: true,
    startDate: "2025-10-20",
    hoursTotal: 18,
    sessions: [
      { day: "Lunes", start: "11:00", end: "13:00" },
      { day: "Martes", start: "11:00", end: "13:00" },
      { day: "Jueves", start: "11:00", end: "13:00" },
    ],
  },
  {
    id: "aws-architect",
    name: "AWS Architect 1",
    color: "#f6a45c",
    enabled: true,
    startDate: "2025-10-25",
    hoursTotal: 16,
    sessions: [{ day: "Sábado", start: "08:00", end: "11:00" }],
  },
  {
    id: "azure-fund",
    name: "Azure Fundamentals",
    color: "#57c7c7",
    enabled: true,
    startDate: "2025-10-25",
    hoursTotal: 16,
    sessions: [{ day: "Sábado", start: "09:00", end: "13:00" }],
  },
  {
    id: "auto-negocios",
    name: "Automatización de Negocios con IA",
    color: "#4dc98d",
    enabled: true,
    startDate: "2025-11-12",
    hoursTotal: 16,
    sessions: [
      { day: "Miércoles", start: "11:00", end: "14:00" },
      { day: "Sábado", start: "11:00", end: "14:00" },
    ],
  },
  {
    id: "power-bi",
    name: "Power BI – Básico + IA",
    color: "#cf7df7",
    enabled: true,
    startDate: "2025-10-21",
    hoursTotal: 18,
    sessions: [
      { day: "Martes", start: "14:00", end: "17:00" },
      { day: "Jueves", start: "14:00", end: "17:00" },
    ],
  },
  {
    id: "sql1",
    name: "SQL – BASE DE DATOS 1 + IA",
    color: "#8fd16a",
    enabled: true,
    startDate: "2025-10-20",
    hoursTotal: 18,
    sessions: [
      { day: "Lunes", start: "15:00", end: "18:00" },
      { day: "Miércoles", start: "15:00", end: "18:00" },
      { day: "Viernes", start: "15:00", end: "18:00" },
    ],
  },
  {
    id: "cd2",
    name: "Ciencia de Datos 2: Big Data + IA",
    color: "#ff7a7a",
    enabled: true,
    startDate: "2025-11-11",
    hoursTotal: 18,
    sessions: [
      { day: "Martes", start: "18:00", end: "21:00" },
      { day: "Jueves", start: "18:00", end: "21:00" },
    ],
  },
  {
    id: "analisis-excel",
    name: "Análisis de Datos con Excel + IA",
    color: "#6ea8fe",
    enabled: true,
    startDate: "2025-11-07",
    hoursTotal: 18,
    sessions: [
      { day: "Lunes", start: "18:00", end: "20:00" },
      { day: "Martes", start: "18:00", end: "20:00" },
      { day: "Miércoles", start: "18:00", end: "20:00" },
      { day: "Jueves", start: "18:00", end: "20:00" },
      { day: "Viernes", start: "18:00", end: "20:00" },
    ],
  },
  {
    id: "ciber-eh",
    name: "Ciberseguridad: Ethical Hacking (C|EH) + IA",
    color: "#8bdbb0",
    enabled: true,
    startDate: "2025-10-29",
    hoursTotal: 18,
    sessions: [{ day: "Miércoles", start: "18:00", end: "22:00" }],
  },
  {
    id: "js-basico",
    name: "Javascript Básico + IA",
    color: "#c2d66b",
    enabled: true,
    startDate: "2025-11-12",
    hoursTotal: 18,
    sessions: [
      { day: "Miércoles", start: "14:00", end: "17:00" },
      { day: "Sábado", start: "14:00", end: "17:00" },
    ],
  },
  {
    id: "llms",
    name: "Grandes Modelos de Lenguaje (LLMs): Agente Inteligente",
    color: "#7bc5ff",
    enabled: true,
    startDate: "2025-10-21",
    hoursTotal: 16,
    sessions: [
      { day: "Martes", start: "14:00", end: "17:00" },
      { day: "Jueves", start: "14:00", end: "17:00" },
      { day: "Sábado", start: "14:00", end: "17:00" },
    ],
  },
  {
    id: "devops-docker",
    name: "Fundamentos de DevOps: Dockers",
    color: "#ffaa99",
    enabled: true,
    startDate: "2025-10-25",
    hoursTotal: 16,
    sessions: [{ day: "Sábado", start: "14:00", end: "17:00" }],
  },
  {
    id: "autocad1",
    name: "Autocad 1: Dibujos a escala + IA",
    color: "#a58cf5",
    enabled: true,
    startDate: "2025-10-20",
    hoursTotal: 20,
    sessions: [
      { day: "Lunes", start: "15:00", end: "18:00" },
      { day: "Viernes", start: "15:00", end: "18:00" },
    ],
  },
];

const COLOR_PALETTE = [
  "#7bdcf7","#57c7c7","#4dc98d","#8fd16a","#c2d66b","#ffaa99","#f6a45c","#ff7a7a","#cf7df7","#a58cf5","#6ea8fe","#7bc5ff","#8bdbb0","#ffc98b","#9be7ff"
];

// --- Card Overlay Holográfico ---
const HoloOverlay = () => (
  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-80"
       style={{
         background:
           "conic-gradient(from 180deg at 50% 50%, rgba(255,209,255,.35), rgba(209,255,214,.35), rgba(209,224,255,.35), rgba(255,230,209,.35), rgba(255,209,255,.35))",
         boxShadow: "0 0 0 2px rgba(255,255,255,.35), 0 10px 30px rgba(0,0,0,.35) inset",
         backdropFilter: "blur(2px)",
         borderRadius: "1rem",
       }} />
);

// --- Componente principal ---
export default function App() {
  const [courses, setCourses] = useState(initialCourses);
  const [activeId, setActiveId] = useState(null); // para traer al frente
  const [openPickerFor, setOpenPickerFor] = useState(null); // id curso
  const [hoveredCourse, setHoveredCourse] = useState(null); // para resaltar todos los cards del mismo curso

  // Horas visibles en el grid (08:00–22:00)
  const startHour = 8;
  const endHour = 22;
  const minutesSpan = (endHour - startHour) * 60;

  // Sessions expandidas con metadatos por día
  const sessions = useMemo(() => {
    const list = [];
    courses.forEach((c) => {
      if (!c.enabled) return;
      c.sessions.forEach((s, idx) => {
        list.push({
          key: `${c.id}-${idx}`,
          courseId: c.id,
          name: c.name,
          color: c.color,
          day: s.day,
          start: s.start,
          end: s.end,
          startMin: toMinutes(s.start),
          endMin: toMinutes(s.end),
        });
      });
    });
    return list;
  }, [courses]);

  // Agrupar por día
  const sessionsByDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map((d) => [d, []]));
    sessions.forEach((ev) => {
      map[ev.day].push(ev);
    });
    // Calcular desplazamientos por cruce y flag de full overlap
    DAYS.forEach((d) => {
      const dayList = map[d].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
      const assigned = [];
      dayList.forEach((ev) => {
        let offset = 0;
        let fullOverlap = false;
        assigned.forEach((prev) => {
          const overlap = !(ev.endMin <= prev.startMin || ev.startMin >= prev.endMin);
          if (overlap) {
            if (ev.startMin === prev.startMin && ev.endMin === prev.endMin) fullOverlap = true;
            offset = Math.max(offset, (prev.offset || 0) + 1);
          }
        });
        ev.offset = offset; // desplazamiento horizontal
        ev.fullOverlap = fullOverlap;
        assigned.push(ev);
      });
    });
    return map;
  }, [sessions]);

  // Helpers UI
  const updateCourse = (id, patch) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const setCourseColor = (id, color) => updateCourse(id, { color });

  // Render
  return (
    <div className="min-h-screen w-full overflow-x-auto bg-gradient-to-br from-[#0a0c12] via-[#0b0e17] to-[#0c101b] text-slate-100">
      {/* Fondo elegante con bokeh y glass grain */}
      <div className="pointer-events-none fixed inset-0 opacity-60" aria-hidden>
        <svg className="absolute -top-20 -left-20 w-[60rem] h-[60rem] blur-3xl" viewBox="0 0 800 800">
          <defs>
            <radialGradient id="g1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="300" fill="url(#g1)" />
        </svg>
        <svg className="absolute -bottom-40 right-0 w-[52rem] h-[52rem] blur-3xl" viewBox="0 0 800 800">
          <defs>
            <radialGradient id="g2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="300" fill="url(#g2)" />
        </svg>
      </div>

      <main className="mx-auto max-w-[1300px] px-6 pb-28 pt-10">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Configuración de Cursos</h1>
            <p className="mt-1 text-sm text-slate-400">
              Activa/desactiva cursos, ajusta color y revisa horarios. Los activos se muestran en el calendario.
            </p>
          </div>
        </header>

        {/* Panel 1: Lista de cursos */}
        <section className="mb-10 grid grid-cols-1 gap-3">
          {courses.map((c) => (
            <div
              key={c.id}
              className="relative flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              style={{ boxShadow: "0 10px 30px rgba(0,0,0,.25) inset, 0 10px 30px rgba(0,0,0,.25)" }}
            >
              {/* Checkbox */}
              <label className="mr-1 inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => updateCourse(c.id, { enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-600 bg-slate-900/50 text-sky-400 focus:ring-sky-500"
                />
              </label>

              {/* Color dot + picker */}
              <div className="relative">
                <button
                  onClick={() => setOpenPickerFor((p) => (p === c.id ? null : c.id))}
                  className="h-6 w-6 rounded-full ring-2 ring-white/30"
                  title="Cambiar color"
                  style={{ backgroundColor: c.color }}
                />
                {openPickerFor === c.id && (
                  <div className="absolute z-50 mt-2 grid w-64 grid-cols-8 gap-1 rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-2xl backdrop-blur-xl">
                    {COLOR_PALETTE.map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          setCourseColor(c.id, col);
                          setOpenPickerFor(null);
                        }}
                        className="h-6 w-6 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Nombre y resumen de horario a la izquierda */}
              <div className="flex min-w-[18rem] flex-1 flex-col">
                <div className="text-[15px] font-medium leading-tight">{c.name}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.sessions
                    .map((s) => `${s.day.substring(0, 2)} (${fmt12h(s.start)} - ${fmt12h(s.end)})`)
                    .join(" · ")}
                </div>
              </div>

              {/* Fecha de inicio y horas a la derecha */}
              <div className="ml-auto flex flex-col items-end text-sm">
                <div className="font-semibold text-slate-200">{c.startDate}</div>
                <div className="text-xs text-slate-400">{c.hoursTotal} hrs</div>
              </div>
            </div>
          ))}
        </section>

        {/* Panel 2: Calendario semanal */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Horario Semanal</h2>
            <div className="text-xs text-slate-400">Click para traer al frente · Hover = tilt · Cruces con desplazamiento</div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl" style={{boxShadow:"0 20px 60px rgba(0,0,0,.35)"}}>
            {/* Encabezados */}
            <div className="grid grid-cols-7 gap-2 text-sm">
              <div className="h-10" />
              {DAYS.map((d) => (
                <div key={d} className="flex h-10 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de horas + eventos */}
            <div className="mt-2 grid grid-cols-7 gap-2">
              {/* Columna de horas */}
              <div className="relative">
                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                  <div key={i} className="flex h-16 items-start justify-end pr-3 text-xs text-slate-500">
                    {String(startHour + i).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Días */}
              {DAYS.map((day) => (
                <div key={day} className="relative">
                  {/* líneas horizontales */}
                  {Array.from({ length: endHour - startHour }).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0" style={{ top: i * 64 }}>
                      <div className="h-16 border-t border-white/5" />
                    </div>
                  ))}

                  {/* Eventos del día */}
                  <div className="relative" style={{ height: (endHour - startHour) * 64 }}>
                    {(sessionsByDay[day] || []).map((ev, idx) => {
                      const top = ((ev.startMin - startHour * 60) / minutesSpan) * ((endHour - startHour) * 64);
                      const height = ((ev.endMin - ev.startMin) / minutesSpan) * ((endHour - startHour) * 64);
                      const xOffset = ev.offset * 10; // desplazamiento leve
                      const zBase = activeId === ev.key ? 50 : 10 + ev.offset; // al frente si está activo
                      const isHoveredGroup = hoveredCourse === ev.courseId;
                      const z = isHoveredGroup ? 60 : zBase;
                      return (
                        <div
                          key={ev.key}
                          onMouseDown={() => setActiveId(ev.key)}
                          onMouseEnter={() => setHoveredCourse(ev.courseId)}
                          onMouseLeave={() => setHoveredCourse(null)}
                          className={
                            "group absolute w-[calc(100%-8px)] cursor-pointer select-none rounded-2xl p-3 text-sm shadow-2xl transition-transform duration-150 hover:-rotate-1 " +
                            "active:scale-[1.01]"
                          }
                          style={{
                            top,
                            left: xOffset,
                            height,
                            zIndex: z,
                            background: `radial-gradient(120% 120% at 10% 10%, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg, ${ev.color}99, ${ev.color}66)` ,
                            backdropFilter: "blur(8px)",
                            border: `1px solid rgba(255,255,255,.24)`,
                            boxShadow: isHoveredGroup
                              ? `0 0 0 2px ${ev.color}, 0 0 26px ${ev.color}66, 0 10px 30px rgba(0,0,0,.35)`
                              : "0 10px 30px rgba(0,0,0,.35)",
                          }}
                        >
                          {/* Borde adaptativo */}
                          {isHoveredGroup ? (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1"
                                 style={{ boxShadow: `0 0 0 2px ${ev.color}, 0 0 28px ${ev.color}66` }} />
                          ) : (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/20" />
                          )}
                          {/* Overlay holográfico cuando hay cruce 100% */}
                          {ev.fullOverlap && <HoloOverlay />}

                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-slate-100 drop-shadow leading-tight" style={{display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{ev.name}</div>
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] text-slate-900" style={{backgroundColor: ev.color}}>
                              {DAY_KEY[ev.day]}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full" style={{ width: "100%", background: `${ev.color}` , opacity: .5 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          <p>Glasmorphism oscuro, desplazamiento por cruces y overlay para solapes 100%.</p>
        </footer>
      </main>
    </div>
  );
}
