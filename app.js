import { BASE_URL } from "./api.js";


const content = document.getElementById("dynamic-content");
const links = document.querySelectorAll(".history__menu-link");




const KINE_TREATMENTS = {
  "Dr. Francisca torres": [
    {
      name: "1 sesión de kinesiología de piso pélvico",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Plan 4 sesiones postparto",
      duration: "4 sesiones • 1 mes",
      price: "$90.000",
    },
    {
      name: "Evaluación inicial suelo pélvico",
      duration: "60 minutos",
      price: "$35.000",
    },
  ],
  "Dr. Ignacio Valdés": [
    {
      name: "Kinesiología neurológica adulto",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Rehabilitación post-ACV",
      duration: "55 minutos",
      price: "$35.000",
    },
    {
      name: "Evaluación neurológica",
      duration: "60 minutos",
      price: "$40.000",
    },
  ],
  "Dr. Matias Olivares": [
    {
      name: "Rehabilitación respiratoria adultos",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Rehabilitación respiratoria pediátrica",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Evaluación respiratoria",
      duration: "60 minutos",
      price: "$35.000",
    },
  ],
};

const DEFAULT_TREATMENTS = [
  {
    name: "1 sesión de kinesiología",
    duration: "45 minutos",
    price: "$25.000",
  },
  {
    name: "Plan 3 sesiones",
    duration: "3 sesiones • 1 semana",
    price: "$70.000",
  },
  {
    name: "Evaluación kinesiológica",
    duration: "60 minutos",
    price: "$35.000",
  },
];

/****************************************************
 * Helpers
 ****************************************************/

function withNgrokHeader(headers = {}) {
  return { "ngrok-skip-browser-warning": "true", ...headers };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: withNgrokHeader(options.headers || {}) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function safeParseJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom ... 6=Sáb
  const diff = (day + 6) % 7; // Lun -> 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "KI";
}

function formatWeekLabel(startDate) {
  const end = addDays(startDate, 6);
  const startTxt = startDate.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }).replace(".", "");
  const endTxt = end.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }).replace(".", "");
  const yearTxt = startDate.getFullYear();
  return `${startTxt} — ${endTxt} ${yearTxt}`;
}

function formatDayLabel(dateObj) {
  // "lunes, 09 de diciembre"
  return dateObj.toLocaleDateString("es-CL", { weekday: "long", day: "2-digit", month: "long" });
}

function toISODateLocal(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}



function hourFromTimeStr(timeStr) {
  const h = parseInt((timeStr || "").slice(0, 2), 10);
  return Number.isFinite(h) ? h : 0;
}

function getPhotoClassForKineName(name = "") {
  const n = name.toLowerCase();
  if (n.includes("ignacio")) return "schedule-profile__photo--ignacio";
  if (n.includes("mart")) return "schedule-profile__photo--martin";
  if (n.includes("javier")) return "schedule-profile__photo--javier";
  if (n.includes("isidora")) return "schedule-profile__photo--isidora";
  return "schedule-profile__photo--lissette";
}

/****************************************************
 * Autenticación UI (Header)
 ****************************************************/

function isUserLoggedIn() {
  const token = localStorage.getItem("authToken");
  const rawUser = localStorage.getItem("user");
  return !!token && !!rawUser;
}


function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function isKineUser(user) {
  const role = localStorage.getItem("role") || user?.role;
  return role === "kinesiologist" || user?.specialty != null || user?.box != null;
}

function updateAuthUI() {
  const loginLink = document.querySelector("[data-auth-action]");
  const userLink = document.querySelector("[data-auth-user-link]");

  // Si esta página no tiene header con estos elementos, salimos.
  if (!loginLink || !userLink) return;

  const token   = localStorage.getItem("authToken");
  const rawUser = localStorage.getItem("user");

  if (token && rawUser) {
    let name = "Paciente";
    try {
      const user = JSON.parse(rawUser);
      name = user.name || user.full_name || user.email || name;
    } catch (e) {
      console.warn("No se pudo parsear user desde localStorage:", e);
    }

    loginLink.textContent = "Cerrar sesión";
    userLink.textContent  = `Hola, ${name}`;

    loginLink.href = "#";
    loginLink.onclick = (ev) => {
      ev.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.href = "ingreseAqui.html";
    };

    userLink.href = "historial.html";
    userLink.onclick = null;
  } else {
    loginLink.textContent = "Ingresar";
    userLink.textContent  = "Invitado";
    loginLink.href = "ingreseAqui.html";
    userLink.href = "ingreseAqui.html";
    loginLink.onclick = null;
    userLink.onclick = null;
  }
}


// Compatibilidad con llamadas existentes
window.updateAuthUI = updateAuthUI;

/**
 * agendar.html
 * - Lista profesionales reales desde el backend
 * - Muestra perfil + servicios
 * - "Ver horarios" => guarda pendingBooking y te manda a horarios.html (UI antigua)
 */
async function initKineDirectory() {
  const directoryRoot = document.querySelector("[data-kine-directory]");
  if (!directoryRoot) return;

  const listEl = directoryRoot.querySelector("[data-kine-list]");
  const placeholder = directoryRoot.querySelector(".kine-directory__placeholder");
  const detailEmpty = directoryRoot.querySelector("[data-kine-empty]");
  const detailProfile = directoryRoot.querySelector("[data-kine-profile]");

  const avatarEl = directoryRoot.querySelector("[data-kine-avatar]");
  const nameEl = directoryRoot.querySelector("[data-kine-name]");
  const specialtyEl = directoryRoot.querySelector("[data-kine-specialty]");
  const boxEl = directoryRoot.querySelector("[data-kine-box]");
  const rutEl = directoryRoot.querySelector("[data-kine-rut]");
  const descEl = directoryRoot.querySelector("[data-kine-description]");
  const phoneEl = directoryRoot.querySelector("[data-kine-phone]");
  const phoneLinkEl = directoryRoot.querySelector("[data-kine-phone-link]");
  const emailEl = directoryRoot.querySelector("[data-kine-email]");
  const emailLinkEl = directoryRoot.querySelector("[data-kine-email-link]");

  const servicesContainer = directoryRoot.querySelector("[data-kine-services]");
  const slotsContainer = directoryRoot.querySelector("[data-kine-slots]");

  if (placeholder) placeholder.style.display = "flex";

  let professionals = [];
  try {
    const res = await fetch(BASE_URL + "api/kinesiologists", {
      headers: withNgrokHeader(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    professionals = await res.json();
  } catch (err) {
    console.error("Error cargando kinesiologos:", err);
    if (placeholder) placeholder.innerHTML = "<p>Error al cargar los profesionales.</p>";
    return;
  }

  if (placeholder) placeholder.style.display = "none";
  if (listEl) listEl.innerHTML = "";

  professionals.forEach((kine) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "kine-directory__item";
    item.dataset.id = kine.id;
    item.setAttribute("aria-current", "false");

    const avatar = document.createElement("div");
    avatar.className = "kine-directory__avatar";
    avatar.textContent = getInitials(kine.name);

    const info = document.createElement("div");
    info.className = "kine-directory__info";

    const title = document.createElement("h4");
    title.textContent = kine.name || "Profesional";

    const specialty = document.createElement("p");
    specialty.textContent = kine.specialty || "Kinesiología";

    const chevron = document.createElement("span");
    chevron.className = "kine-directory__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "›";

    info.appendChild(title);
    info.appendChild(specialty);

    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(chevron);

    item.addEventListener("click", () => showKineDetail(kine));
    listEl.appendChild(item);
  });

  function showKineDetail(k) {
    // activo en lista
    listEl?.querySelectorAll(".kine-directory__item").forEach((btn) => {
      const isActive = btn.dataset.id == k.id;
      btn.classList.toggle("kine-directory__item--active", isActive);
      btn.setAttribute("aria-current", isActive ? "true" : "false");
    });

    if (detailEmpty) detailEmpty.hidden = true;
    if (detailProfile) detailProfile.hidden = false;

    if (nameEl) nameEl.textContent = k.name || "";
    if (specialtyEl) specialtyEl.textContent = k.specialty || "";
    if (boxEl) boxEl.textContent = k.box || "";
    if (rutEl) rutEl.textContent = k.rut || "";
    if (descEl) descEl.textContent = k.description || "";

    if (phoneEl) phoneEl.textContent = k.phone_number || "";
    if (phoneLinkEl) phoneLinkEl.href = k.phone_number ? `https://wa.me/56${k.phone_number}` : "#";

    if (emailEl) emailEl.textContent = k.email || "";
    if (emailLinkEl) emailLinkEl.href = k.email ? `mailto:${k.email}` : "#";

     if (avatarEl) {
      avatarEl.style.backgroundImage = `url('./img/default-kine.jpg')`;
      avatarEl.textContent = getInitials(k.name);
    }

    renderServices(k);

    // Ya no cargamos slots aquí (se hace en horarios.html)
    if (slotsContainer) {
      slotsContainer.innerHTML = `
        <p class="kine-directory__slots-empty">
          Selecciona “Ver horarios” en un servicio para continuar en la pestaña de horarios.
        </p>
      `;
    }
  }

  function renderServices(kine) {
    if (!servicesContainer) return;

    const treatments = KINE_TREATMENTS[kine.name] || DEFAULT_TREATMENTS;

    servicesContainer.innerHTML = `
      <h3 class="kine-services__title">Selecciona un servicio</h3>
      <div class="kine-services__grid"></div>
    `;

    const grid = servicesContainer.querySelector(".kine-services__grid");

    treatments.forEach((t) => {
      const card = document.createElement("article");
      card.className = "service-card";
      card.innerHTML = `
        <div class="service-card__info">
          <h4>${t.name}</h4>
          <span>${t.duration}</span>
        </div>
        <strong class="service-card__price">${t.price}</strong>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "service-card__action";
      btn.textContent = "Ver horarios";

      btn.addEventListener("click", () => {
        // selección visual
        grid.querySelectorAll(".service-card").forEach((c) => c.classList.remove("service-card--selected"));
        card.classList.add("service-card--selected");

        const pendingBooking = {
          kinesiologistId: kine.id,
          kinesiologistName: kine.name,
          kinesiologistSpecialty: kine.specialty || "",
          serviceName: t.name,
          serviceDuration: t.duration,
          servicePrice: t.price,
          modality: "Presencial",
        };

        localStorage.setItem("pendingBooking", JSON.stringify(pendingBooking));
        window.location.href = `horarios.html?kineId=${encodeURIComponent(kine.id)}`;
      });

      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  // autoselección para no dejar vacío
  if (professionals.length) showKineDetail(professionals[0]);
}

/**
 * horarios.html (UI antigua)
 * - Carga profesionales reales
 * - Renderiza semana (7 días) con diseño .schedule-day
 * - Carga slots por día desde: /api/kinesiologists/<id>/slots/?date=YYYY-MM-DD
 * - Guarda todo en pendingBooking y habilita "Continuar"
 */
async function initSchedulePage() {
  const page = document.body?.dataset?.page;
  if (page !== "horarios") return;

  console.log("Init página HORARIOS (agenda semanal)");

  const professionalSelect = document.querySelector("[data-schedule-professional]");
  const weekLabelEl = document.querySelector("[data-schedule-week-label]");
  const weekRoot = document.querySelector("[data-schedule-week]");
  const prevBtn = document.querySelector("[data-schedule-prev]");
  const nextBtn = document.querySelector("[data-schedule-next]");

  const slotsSection = document.querySelector("[data-schedule-slots]");
  const dayLabelEl = document.querySelector("[data-schedule-day-label]");
  const emptyEl = document.querySelector("[data-schedule-empty]");

  const morningGroup = document.querySelector('[data-slot-group="morning"]');
  const afternoonGroup = document.querySelector('[data-slot-group="afternoon"]');
  const morningList = document.querySelector('[data-slot-period="morning"]');
  const afternoonList = document.querySelector('[data-slot-period="afternoon"]');

  // Summary
  const photoEl = document.querySelector("[data-schedule-photo]");
  const roleEl = document.querySelector("[data-schedule-role]");
  const nameEl = document.querySelector("[data-schedule-name]");

  const serviceTitleEl = document.querySelector("[data-schedule-service]");
  const modalityEl = document.querySelector("[data-schedule-modality]");
  const durationEl = document.querySelector("[data-schedule-duration]");
  const priceEl = document.querySelector("[data-schedule-price]");

  const selectionLabelEl = document.querySelector("[data-schedule-selection-label]");
  const confirmBtn = document.querySelector("[data-schedule-confirm]");

  if (!professionalSelect || !weekRoot || !confirmBtn) {
    console.warn("horarios.html: faltan elementos data-schedule-* en el DOM");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const urlKineId = params.get("kineId");

  // pendingBooking viene desde agendar.html
  let pending = safeParseJSON(localStorage.getItem("pendingBooking"), {}) || {};

  let professionals = [];
  try {
    professionals = await fetchJson(BASE_URL + "api/kinesiologists");
  } catch (err) {
    console.error("No se pudieron cargar los profesionales:", err);
    professionalSelect.innerHTML = `<option value="">Error al cargar</option>`;
    return;
  }

  // Selección inicial: URL kineId > pendingBooking > primero
  const initialKineId = urlKineId || pending.kinesiologistId || (professionals[0]?.id ? String(professionals[0].id) : "");
  let selectedKine = professionals.find((p) => String(p.id) === String(initialKineId)) || professionals[0] || null;

  // Pintar select
  professionalSelect.innerHTML = "";
  professionals.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = String(k.id);
    opt.textContent = k.name;
    professionalSelect.appendChild(opt);
  });
  if (selectedKine) professionalSelect.value = String(selectedKine.id);

  // Estado de semana + cache
  let weekStart = startOfWeekMonday(new Date());
  const minWeekStart = startOfWeekMonday(new Date());
  let selectedDayISO = null;
  let selectedSlot = null;
  let weekCache = new Map(); // iso => slots[]

  function setSummaryProfessional(k) {
    if (!k) return;
    if (nameEl) nameEl.textContent = k.name || "";
    if (roleEl) roleEl.textContent = k.specialty || "";
    if (photoEl) photoEl.className = `schedule-profile__photo ${getPhotoClassForKineName(k.name)}`;

    // Mantener pendingBooking actualizado
    pending = {
      ...pending,
      kinesiologistId: k.id,
      kinesiologistName: k.name,
      kinesiologistSpecialty: k.specialty || "",
    };
    localStorage.setItem("pendingBooking", JSON.stringify(pending));
  }

  function setSummaryService() {
    if (serviceTitleEl) serviceTitleEl.textContent = pending.serviceName || "Sesión de kinesiología";
    if (modalityEl) modalityEl.textContent = pending.modality || "Presencial";
    if (durationEl) durationEl.textContent = pending.serviceDuration || "45 minutos";
    if (priceEl) priceEl.textContent = pending.servicePrice || "$0";
  }

  function setSelectionLabel(text) {
    if (selectionLabelEl) selectionLabelEl.textContent = text || "Ninguna hora seleccionada";
  }

  function clearSlotsUI() {
    if (morningList) morningList.innerHTML = "";
    if (afternoonList) afternoonList.innerHTML = "";
    if (morningGroup) morningGroup.hidden = true;
    if (afternoonGroup) afternoonGroup.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (slotsSection) slotsSection.hidden = true;
  }

  function selectDayButton(iso) {
    weekRoot.querySelectorAll(".schedule-day").forEach((b) => b.classList.remove("schedule-day--selected"));
    const btn = weekRoot.querySelector(`.schedule-day[data-date="${iso}"]`);
    if (btn) btn.classList.add("schedule-day--selected");
  }

  function makeDayButton(dateObj, slotsCount) {
    const iso = toISODateLocal(dateObj);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "schedule-day";
    btn.dataset.date = iso;
    btn.setAttribute("role", "listitem");

    const dayName = dateObj.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "");
    const dayNum = dateObj.toLocaleDateString("es-CL", { day: "2-digit" });
    const month = dateObj.toLocaleDateString("es-CL", { month: "short" }).replace(".", "");

    btn.innerHTML = `
      <span class="schedule-day__name">${dayName}</span>
      <span class="schedule-day__date">${dayNum} ${month}</span>
      <span class="schedule-day__info">${slotsCount} dispo..</span>
    `;

    const todayIso = toISODateLocal(new Date());
    const blocked = slotsCount === 0 || iso < todayIso;
    if (blocked) {
      btn.dataset.state = "blocked";
      btn.disabled = true;
      return btn;
    }

    btn.addEventListener("click", () => {
      selectedDayISO = iso;
      selectedSlot = null;
      setSelectionLabel("Ninguna hora seleccionada");
      confirmBtn.disabled = true;

      selectDayButton(iso);
      renderSlotsForDay(dateObj, weekCache.get(iso) || []);
    });

    return btn;
  }

  function makeSlotBtn(slot) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "schedule-slot";
    b.textContent = (slot.start_time || "").slice(0, 5);

    b.addEventListener("click", () => {
      document.querySelectorAll(".schedule-slot").forEach((x) => x.classList.remove("is-selected"));
      b.classList.add("is-selected");

      selectedSlot = slot;
      const iso = slot.date || selectedDayISO;
      const time = (slot.start_time || "").slice(0, 5);
      setSelectionLabel(`${iso} • ${time}`);

      // Actualizar pendingBooking con fecha/hora
      pending = {
        ...pending,
        date: iso,
        startTime: slot.start_time,
        endTime: slot.end_time || null,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(pending));

      confirmBtn.disabled = false;
    });

    return b;
  }

  function renderSlotsForDay(dateObj, slots) {
    if (!slotsSection) return;

    clearSlotsUI();

    // 1) Mostrar sección
slotsSection.hidden = false;

// 2) Marcar estado abierto (esto es CLAVE por tu CSS)
slotsSection.dataset.state = "open";

// 3) Setear altura para el max-height animado
requestAnimationFrame(() => {
  const h = slotsSection.scrollHeight;
  slotsSection.style.setProperty("--schedule-slots-height", `${h}px`);
});

    if (dayLabelEl) dayLabelEl.textContent = formatDayLabel(dateObj);

    const morning = [];
    const afternoon = [];

    (slots || []).forEach((s) => {
      const h = hourFromTimeStr(s.start_time);
      (h < 13 ? morning : afternoon).push(s);
    });

    if (morning.length) {
      if (morningGroup) morningGroup.hidden = false;
      morning.forEach((s) => morningList?.appendChild(makeSlotBtn(s)));
    }

    if (afternoon.length) {
      if (afternoonGroup) afternoonGroup.hidden = false;
      afternoon.forEach((s) => afternoonList?.appendChild(makeSlotBtn(s)));
    }

    const isEmpty = !morning.length && !afternoon.length;
    if (emptyEl) emptyEl.hidden = !isEmpty;
  }

  async function loadWeekSlots(transitionDir = "") {
      if (!selectedKine) return;

    clearSlotsUI();
      setSelectionLabel("Ninguna hora seleccionada");
      confirmBtn.disabled = true;
    if (weekLabelEl) weekLabelEl.textContent = formatWeekLabel(weekStart)

    // Deshabilitar retroceso si ya estás en la semana actual
      if (prevBtn) prevBtn.disabled = weekStart.getTime() <= minWeekStart.getTime();

      const shouldAnimate = transitionDir === "forward" || transitionDir === "backward";
      if (shouldAnimate) {
        weekRoot.dataset.transition = transitionDir;
      } else {
        weekRoot.removeAttribute("data-transition");
      }


    const days = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        const iso = toISODateLocal(d);
        days.push({ date: d, iso });
      }

    weekRoot.innerHTML = "";
    weekRoot.setAttribute("aria-busy", "true");

    try {
      const results = await Promise.all(
        days.map((info) =>
          fetchJson(`${BASE_URL}api/kinesiologists/${selectedKine.id}/slots/?date=${info.iso}`)
            .catch(() => [])
        )
      );

      weekCache = new Map();
      results.forEach((slots, idx) => {
        weekCache.set(days[idx].iso, Array.isArray(slots) ? slots : []);
      });

      days.forEach((info) => {
        const slots = weekCache.get(info.iso) || [];
        weekRoot.appendChild(makeDayButton(info.date, slots.length));
      });

      // Auto-abrir el día de hoy (o el siguiente disponible) para que se desplieguen las horas
      const todayIso = toISODateLocal(new Date());
      const inCurrentWeek = weekStart.getTime() === minWeekStart.getTime();

      const pickFrom = inCurrentWeek ? days.filter((d) => d.iso >= todayIso) : days;
      const firstAvailable = pickFrom.find((d) => (weekCache.get(d.iso) || []).length > 0 && d.iso >= todayIso);

      if (firstAvailable) {
        selectedDayISO = firstAvailable.iso;
        selectDayButton(firstAvailable.iso);
        renderSlotsForDay(firstAvailable.date, weekCache.get(firstAvailable.iso) || []);
      }
    } finally {
      weekRoot.setAttribute("aria-busy", "false");

      if (shouldAnimate) {
        const clearTransition = () => {
          weekRoot.removeAttribute("data-transition");
          weekRoot.removeEventListener("animationend", clearTransition);
        };
        weekRoot.addEventListener("animationend", clearTransition);
      }
    }
  }

  // Eventos
  professionalSelect.addEventListener("change", async () => {
    const id = professionalSelect.value;
    selectedKine = professionals.find((p) => String(p.id) === String(id)) || null;

    setSummaryProfessional(selectedKine);
    weekStart = startOfWeekMonday(new Date());
    selectedDayISO = null;
    selectedSlot = null;

     await loadWeekSlots();
  });

  prevBtn?.addEventListener("click", async () => {
    const candidate = addDays(weekStart, -7);
    // No permitir retroceder a semanas anteriores a la semana actual
    weekStart = candidate.getTime() < minWeekStart.getTime() ? new Date(minWeekStart) : candidate;
    selectedDayISO = null;
    selectedSlot = null;
    await loadWeekSlots("backward");
  });

  nextBtn?.addEventListener("click", async () => {
    weekStart = addDays(weekStart, +7);
    selectedDayISO = null;
    selectedSlot = null;
    await loadWeekSlots("forward");
  });

  confirmBtn.addEventListener("click", () => {
    // pendingBooking ya tiene kine + servicio + (si seleccionó) fecha/hora
    const normalized = {
      ...pending,
      startTime: pending?.startTime || pending?.start_time,
    };

    if (!normalized?.date || !normalized?.startTime) return;

    localStorage.setItem("pendingBooking", JSON.stringify(normalized));

    const nextStep = isUserLoggedIn() ? "confirmacion.html" : "datos.html";
    window.location.href = nextStep;
  });

  // Boot
  setSummaryService();
  setSummaryProfessional(selectedKine);
  await loadWeekSlots();
}

function initLoginSystem() {
  const loginForm = document.querySelector("#loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    try {
      const response = await fetch(`${BASE_URL}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.error("Login HTTP error:", response.status);
        alert("Credenciales incorrectas.");
        return;
      }

      const data = await response.json();

      // ✅ Guardar sesión
      localStorage.setItem("authToken", data.token);
      if (data.role) localStorage.setItem("role", data.role);
      if (data.user) localStorage.setItem("user", JSON.stringify({ ...data.user, role: data.role || null }));

      // ✅ Detectar si es kinesiólogo por permiso REAL (probando el endpoint)
      try {
        const probe = await fetch(`${BASE_URL}api/kinesiologist/appointments/upcoming/`, {
          headers: {
            "Authorization": `Token ${data.token}`,
            "ngrok-skip-browser-warning": "true",
          }
        });

        if (probe.status === 200) {
          window.location.href = "panelkine.html";
        } else {
          window.location.href = "historial.html";
        }
      } catch (e) {
        // si falla por red o algo raro, cae a historial
        window.location.href = "historial.html";
      }

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    }
  });
}

function initPatientDataPage() {
  const page = document.body.dataset.page;
  if (page !== "datos") return;

  console.log("Init página DATOS (registro de paciente)");

  // Elementos del formulario
  const rutInput = document.querySelector("[data-patient-rut]");
  const nameInput = document.querySelector("[data-patient-fullname]");
  const emailInput = document.querySelector("[data-patient-email]");
  const phoneInput = document.querySelector("[data-patient-phone]");
  const passwordInput = document.querySelector("[data-patient-password]");
  const passwordConfirmInput = document.querySelector("[data-patient-password-confirm]");
  const submitBtn = document.querySelector("[data-patient-submit]");

  // Spans de error
  const rutError = document.querySelector("[data-rut-error]");
  const nameError = document.querySelector("[data-name-error]");
  const emailError = document.querySelector("[data-email-error]");
  const phoneError = document.querySelector("[data-phone-error]");
  const passwordError = document.querySelector("[data-password-error]");
  const passwordConfirmError = document.querySelector("[data-password-confirm-error]");

  // Elementos del resumen (tarjeta derecha)
  const kineNameEl = document.querySelector("[data-patient-name]");
  const kineRoleEl = document.querySelector("[data-patient-role]");
  const serviceTitleEl = document.querySelector("[data-patient-service]");
  const modalityEl = document.querySelector("[data-patient-modality]");
  const durationEl = document.querySelector("[data-patient-duration]");
  const priceEl = document.querySelector("[data-patient-price]");
  const selectionEl = document.querySelector("[data-patient-selection]");

  /***********************************************************
   * 1) Cargar info de la hora guardada en localStorage
   ***********************************************************/
  try {
    const pendingStr = localStorage.getItem("pendingBooking");
    console.log("pendingBooking en datos.html:", pendingStr);
    if (pendingStr) {
      const pending = JSON.parse(pendingStr);
      console.log("pendingBooking parseado:", pending);

      if (kineNameEl && pending.kinesiologistName) {
        kineNameEl.textContent = pending.kinesiologistName;
      }
      if (kineRoleEl && pending.specialty) {
        kineRoleEl.textContent = pending.specialty;
      }
      if (serviceTitleEl && pending.serviceName) {
        serviceTitleEl.textContent = pending.serviceName;
      }
      if (durationEl && pending.duration) {
        durationEl.textContent = pending.duration;
      }
      if (priceEl && pending.price) {
        priceEl.textContent = pending.price;
      }

      // 👈 AQUÍ ESTABA EL BUG: startTime vs start_time
      const start = pending.startTime || pending.start_time;
      if (selectionEl && pending.date && start) {
        const hora = start.slice(0, 5);
        selectionEl.textContent = `${pending.date} a las ${hora} hrs`;
      }
    }
  } catch (e) {
    console.warn("No se pudo leer pendingBooking:", e);
  }

  /***********************************************************
   * Helper para limpiar errores
   ***********************************************************/
  function clearErrors() {
    [rutError, nameError, emailError, phoneError, passwordError, passwordConfirmError]
      .forEach((el) => {
        if (el) el.textContent = "";
      });
  }

  /***********************************************************
   * 2) Click en "CONFIRMAR HORARIO" (crear cuenta + confirmar)
   ***********************************************************/
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      console.log("CLICK en CONFIRMAR HORARIO");
      clearErrors();

      // a) Validar horario seleccionado
      const rawSelection = localStorage.getItem("pendingBooking");
      if (!rawSelection) {
        alert("Primero selecciona un horario en la pantalla anterior.");
        return;
      }

      let selection;
      try {
        selection = JSON.parse(rawSelection);
      } catch (e) {
        console.error("Error parseando pendingBooking:", e);
        alert("Ocurrió un problema con la hora seleccionada. Vuelve a escogerla.");
        return;
      }

      // b) Validar formulario
      const rut = rutInput?.value.trim() || "";
      const name = nameInput?.value.trim() || "";
      const email = emailInput?.value.trim() || "";
      const phone = phoneInput?.value.trim() || "";
      const password = passwordInput?.value.trim() || "";
      const confirm = passwordConfirmInput?.value.trim() || "";

      let hasError = false;

      if (!rut) {
        hasError = true;
        if (rutError) rutError.textContent = "Ingresa el RUT del paciente.";
      }
      if (!name) {
        hasError = true;
        if (nameError) nameError.textContent = "Ingresa el nombre completo.";
      }
      if (!email) {
        hasError = true;
        if (emailError) emailError.textContent = "Ingresa un correo electrónico.";
      }
      if (!phone) {
        hasError = true;
        if (phoneError) phoneError.textContent = "Ingresa un número de celular.";
      }
      if (!password) {
        hasError = true;
        if (passwordError) passwordError.textContent = "Ingresa una contraseña.";
      }
      if (!confirm) {
        hasError = true;
        if (passwordConfirmError)
          passwordConfirmError.textContent = "Repite la contraseña.";
      }
      if (password && confirm && password !== confirm) {
        hasError = true;
        if (passwordConfirmError)
          passwordConfirmError.textContent = "Las contraseñas no coinciden.";
      }

      if (hasError) return;

      // c) Registrar paciente en el backend
      let response;
      try {
        response = await fetch(BASE_URL + "api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            rut,
            name,
            email,
            phone_number: phone,
            password,
          }),
        });
      } catch (err) {
        console.error("Error de red:", err);
        alert("No se pudo contactar con el servidor. Intenta nuevamente.");
        return;
      }

      const raw = await response.clone().text();
      console.log("REGISTER RAW RESPONSE:", raw);

      if (!response.ok) {
        let msg = "Error al crear la cuenta.";
        try {
          const data = JSON.parse(raw);
          if (data.detail) msg = data.detail;
        } catch (e) {}
        alert(msg);
        return;
      }

      let data = {};
      try {
        data = JSON.parse(raw);
      } catch (e) {}

      if (data.token) {
  localStorage.setItem("authToken", data.token);
}

if (data.role) {
  localStorage.setItem("role", data.role);
}

if (data.user) {
  localStorage.setItem("user", JSON.stringify(data.user));
}


      const confirmationData = {
        ...selection,
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        patientRut: rut,
      };
      localStorage.setItem("confirmationData", JSON.stringify(confirmationData));

      // d) Mensaje de confirmación de reserva 🎉
      const horaBonita =
        (selection.startTime || selection.start_time || "").slice(0, 5);

      alert(
        `¡Reserva creada con éxito!\n\n` +
        `Paciente: ${name}\n` +
        `Fecha: ${selection.date}\n` +
        `Hora: ${horaBonita} hrs`
      );

      // e) Redirigir a la confirmación con el resumen
      window.location.href = "confirmacion.html";
    });
  }
}


function initPatientHistoryPage() {
  const page = document.body.dataset.page;
  if (page !== "historial") return;

  const rawUser = localStorage.getItem("user");
  const token = localStorage.getItem("authToken");

 
  if (!rawUser || !token) {
    if (!window.location.href.includes("ingreseAqui.html")) {
      window.location.href = "ingreseAqui.html";
    }
    return;
  }

  const user = JSON.parse(rawUser);

  const nameEl = document.querySelector("[data-profile-name]");
  const subtitleEl = document.querySelector("[data-profile-subtitle]");
  const rutEl = document.querySelector("[data-profile-rut]");
  const emailEl = document.querySelector("[data-profile-email]");
  const phoneEl = document.querySelector("[data-profile-phone]");

  if (nameEl) {
    nameEl.textContent =
      user.name ||
      user.full_name ||
      user.username ||
      user.email ||
      "Paciente";
  }

  if (subtitleEl) {
    subtitleEl.textContent = "Paciente registrado";
  }

  if (rutEl && user.rut) {
    rutEl.textContent = user.rut;
  }
  if (emailEl && user.email) {
    emailEl.textContent = user.email;
  }
  if (phoneEl && user.phone_number) {
    phoneEl.textContent = user.phone_number;
  }

  const navUserEl = document.querySelector("[data-nav-username]");
  if (navUserEl) {
    const firstName =
      (user.name || user.full_name || "").split(" ")[0] || user.email;
    navUserEl.textContent = `Hola, ${firstName}`;
  }
}


/******************************
HISTORIAL PERSONAL PACIENTE
 ********************************/





function initHistoryViews() {
  const page = document.body?.dataset?.page;
  if (page !== "historial") return;

  const content = document.getElementById("dynamic-content");
  const links = document.querySelectorAll(".history_menu-link, .history__menu-link");

  if (!content || !links.length) return;

  async function loadView(view) {
    content.innerHTML = "<p>Cargando...</p>";

    try {
      const res = await fetch(`./${view}.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      content.innerHTML = html;

      if (view === "historialpaciente") {
        loadPatientHistory();
      } else if (view === "perfilpaciente") {
        initProfileView();
      } else if (view === "panelkine") {
        initKinePanelView();
      }

    } catch (e) {
      console.error(e);
      content.innerHTML = "<p>Error al cargar la vista.</p>";
    }
  }

  // ✅ SOLO 1 vez (tú lo tenías duplicado)
  links.forEach(link => {
    link.addEventListener("click", () => {
      links.forEach(l => l.classList.remove("is-active"));
      link.classList.add("is-active");
      loadView(link.dataset.view);
    });
  });

  const initialTarget = (location.hash || "#historialpaciente").replace("#", "");
  const initialLink = Array.from(links).find((l) => l.dataset.view === initialTarget) || links[0];

  if (initialLink) {
    links.forEach((l) => l.classList.toggle("is-active", l === initialLink));
    loadView(initialLink.dataset.view);
  }
}




async function loadPatientHistory() {
  const container = document.getElementById("history-list");
  if (!container) return;

  const token = localStorage.getItem("authToken");
  if (!token) {
    container.innerHTML = "<p>Debes iniciar sesión.</p>";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}api/scheduling/patient/history/`, {
      headers: {
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!res.ok) throw new Error(`Error al cargar historial (HTTP ${res.status})`);

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No tienes tratamientos registrados.</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach(item => {
      const article = document.createElement("article");
      article.className = "history-session";

      article.innerHTML = `
        <div class="history-session__meta">
          <div>
            <p class="history-session__date">${item.date} • ${item.time}</p>
            <h2 class="history-session__title">${item.treatment}</h2>
            <p class="history-session__professional">${item.kinesiologist}</p>
          </div>
          <span class="history-session__status history-session__status--${item.status}">
            ${item.status === "completed" ? "Completado" : "Pendiente"}
          </span>
        </div>
      `;

      container.appendChild(article);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error al cargar el historial.</p>";
  }
}

function initConfirmacionPage() {
  const page = document.body?.dataset?.page;
  if (page !== "confirmacion") return;

  const dateEl = document.querySelector("[data-confirmation-date]");
  const timeEl = document.querySelector("[data-confirmation-time]");
  const professionalEl = document.querySelector("[data-confirmation-professional]");
  const modalityEl = document.querySelector("[data-confirmation-modality]");

  const patientEl = document.querySelector("[data-confirmation-patient]");
  const emailEl = document.querySelector("[data-confirmation-email]");
  const phoneEl = document.querySelector("[data-confirmation-phone]");
  const rutEl = document.querySelector("[data-confirmation-rut]");

  const pending =
    safeParseJSON(localStorage.getItem("confirmationData"), null) ||
    safeParseJSON(localStorage.getItem("pendingBooking"), null);
  if (!pending) return;

  const start = pending.startTime || pending.start_time;

  if (dateEl && pending.date) dateEl.textContent = pending.date;
  if (timeEl && start) timeEl.textContent = `${String(start).slice(0, 5)} hrs`;
  if (professionalEl && pending.kinesiologistName) professionalEl.textContent = pending.kinesiologistName;
  if (modalityEl) modalityEl.textContent = pending.modality || "Presencial";
  if (patientEl && pending.patientName) patientEl.textContent = pending.patientName;
  if (emailEl && pending.patientEmail) emailEl.textContent = pending.patientEmail;
  if (phoneEl && pending.patientPhone) phoneEl.textContent = pending.patientPhone;
  if (rutEl && pending.patientRut) rutEl.textContent = pending.patientRut;
}

async function initKinePanelView() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const user = getStoredUser();
  if (!isKineUser(user)) {
    const listElGuard = document.querySelector("[data-kine-upcoming]");
    if (listElGuard) {
      listElGuard.innerHTML = `<div class="kine__empty">Acceso denegado. Esta sección es solo para kinesiólogos.</div>`;
    }
    return;
  }

  const listEl = document.querySelector("[data-kine-upcoming]");
  const countEl = document.querySelector("[data-kine-count]");
  const refreshBtn = document.querySelector("[data-kine-refresh]");

  const detailWrap = document.querySelector("[data-kine-detail]");
  const detailEmpty = document.querySelector("[data-kine-detail-empty]");
  const statusBadge = document.querySelector("[data-kine-status]");

  const patientEl = document.querySelector("[data-kine-patient]");
  const whenEl = document.querySelector("[data-kine-when]");

  const btnConfirm = document.querySelector("[data-kine-confirm]");
  const btnCancel = document.querySelector("[data-kine-cancel]");
  const commentEl = document.querySelector("[data-kine-comment]");
  const btnSave = document.querySelector("[data-kine-save-comment]");
  const msgEl = document.querySelector("[data-kine-msg]");

  if (!listEl) return;

  let selected = null;

  function setMsg(t="") { if (msgEl) msgEl.textContent = t; }

  function setSelected(appt) {
    selected = appt;

    if (!appt) {
      detailWrap.hidden = true;
      if (detailEmpty) detailEmpty.hidden = false;
      if (statusBadge) statusBadge.textContent = "-";
      btnConfirm && (btnConfirm.disabled = true);
      btnCancel && (btnCancel.disabled = true);
      btnSave && (btnSave.disabled = true);
      if (commentEl) commentEl.value = "";
      return;
    }

    if (detailEmpty) detailEmpty.hidden = true;
    detailWrap.hidden = false;

    if (patientEl) patientEl.textContent = appt.patient_name;
    if (whenEl) whenEl.textContent = `${appt.date} • ${String(appt.start_time).slice(0,5)}-${String(appt.end_time).slice(0,5)}`;

    if (statusBadge) statusBadge.textContent = appt.status_label || appt.status;

    btnConfirm && (btnConfirm.disabled = false);
    btnCancel && (btnCancel.disabled = false);
    btnSave && (btnSave.disabled = false);
    if (commentEl) commentEl.value = "";
    setMsg("");
  }

  async function loadUpcoming() {
    listEl.innerHTML = `<div class="kine__empty">Cargando...</div>`;
    setSelected(null);

    const res = await fetch(`${BASE_URL}api/kinesiologist/appointments/upcoming/`, {
      headers: {
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true",
      }
    });

    // Si entra un paciente por error, aquí debería caer en 403
    if (res.status === 403) {
      listEl.innerHTML = `<div class="kine__empty">Acceso denegado. Esta sección es solo para kinesiólogos.</div>`;
      if (countEl) countEl.textContent = "0";
      return;
    }

    if (!res.ok) {
      listEl.innerHTML = `<div class="kine__empty">Error cargando consultas.</div>`;
      return;
    }

    const data = await res.json();
    const items = data.appointments || [];
    if (countEl) countEl.textContent = String(items.length);

    if (items.length === 0) {
      listEl.innerHTML = `<div class="kine__empty">No hay próximas consultas.</div>`;
      return;
    }

    listEl.innerHTML = "";
    items.forEach((a) => {
      const div = document.createElement("div");
      div.className = "kine__item";
      div.innerHTML = `
        <div class="kine__meta">
          <p class="kine__name">${a.patient_name}</p>
          <p class="kine__when">${a.date} • ${String(a.start_time).slice(0,5)}-${String(a.end_time).slice(0,5)}</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="kine__tag">${a.status_label}</span>
          <button class="kine__btn" type="button">Abrir</button>
        </div>
      `;
      div.querySelector("button").addEventListener("click", () => setSelected(a));
      listEl.appendChild(div);
    });
  }

  async function updateStatus(newStatus) {
    if (!selected) return;
    setMsg("Actualizando...");

    const res = await fetch(`${BASE_URL}api/appointments/${selected.appointment_id}/status/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.detail || data.message || "No se pudo actualizar.");
      return;
    }

    setMsg(data.message || "OK");
    await loadUpcoming();
  }

  async function saveComment() {
    if (!selected) return;

    const comment = (commentEl?.value || "").trim();
    if (!comment) {
      setMsg("Escribe un comentario primero.");
      return;
    }

    setMsg("Guardando comentario...");

    const res = await fetch(`${BASE_URL}api/appointments/${selected.appointment_id}/comment/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ kine_comment: comment })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.detail || data.message || "No se pudo guardar.");
      return;
    }

    setMsg(data.message || "Comentario guardado");
    await loadUpcoming();
  }

  refreshBtn?.addEventListener("click", () => loadUpcoming());
  btnConfirm?.addEventListener("click", () => updateStatus("confirmed"));
  btnCancel?.addEventListener("click", () => updateStatus("cancelled"));
  btnSave?.addEventListener("click", () => saveComment());

  // Carga inicial
  await loadUpcoming();
}



async function loadPatientProfile() {
  const page = document.body.dataset.page;
  if (page !== "perfil") return;

  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}api/patient/profile/`, {
      headers: {
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!res.ok) throw new Error("No se pudo cargar perfil");

    const data = await res.json();

    document.querySelector("[data-profile-name]").textContent = data.name || "";
    document.querySelector("[data-profile-rut]").textContent = data.rut || "";
    document.querySelector("[data-profile-email]").textContent = data.email || "";
    document.querySelector("[data-profile-phone]").textContent = data.phone_number || "";

    
    document.getElementById("profileName").value = data.name || "";
    document.getElementById("profileEmail").value = data.email || "";
    document.getElementById("profilePhone").value = data.phone_number || "";

  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
}



function initProfilePage() {
  const page = document.body.dataset.page;
  if (page !== "perfil") return;

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("authToken");

  if (!user || !token) return;


  document.querySelector("[data-profile-name]").textContent = user.name || "";
  document.querySelector("[data-profile-rut]").textContent = user.rut || "";
  document.querySelector("[data-profile-email]").textContent = user.email || "";
  document.querySelector("[data-profile-phone]").textContent = user.phone_number || "";


  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");

  nameInput.value = user.name || "";
  emailInput.value = user.email || "";
  phoneInput.value = user.phone_number || "";

  const view = document.getElementById("profileView");
  const form = document.getElementById("profileForm");

  document.getElementById("editProfileBtn").onclick = () => {
    view.hidden = true;
    form.hidden = false;
  };

  document.getElementById("cancelEditBtn").onclick = () => {
    form.hidden = true;
    view.hidden = false;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${BASE_URL}api/patient/profile/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        name: nameInput.value,
        email: emailInput.value,
        phone_number: phoneInput.value
      })
    });

    if (!res.ok) {
      alert("Error al guardar cambios");
      return;
    }

    const updated = await res.json();
    localStorage.setItem("user", JSON.stringify(updated));

    location.reload();
  };
}



function initProfileView() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return;

  let user;
  try {
    user = JSON.parse(rawUser);
  } catch {
    return;
  }

  
  const nameSpan  = document.querySelector("[data-profile-name]");
  const rutSpan   = document.querySelector("[data-profile-rut]");
  const emailSpan = document.querySelector("[data-profile-email]");
  const phoneSpan = document.querySelector("[data-profile-phone]");

  
  const nameInp  = document.getElementById("profileName");
  const emailInp = document.getElementById("profileEmail");
  const phoneInp = document.getElementById("profilePhone");

  
  const viewBox = document.getElementById("profileView");
  const formBox = document.getElementById("profileForm");

  
  const editBtn   = document.getElementById("editProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");

 
  if (!viewBox || !formBox || !editBtn) return;

 
  const name  = user.name || user.full_name || user.username || "";
  const rut   = user.rut || "";
  const email = user.email || "";
  const phone = user.phone_number || user.phone || "";

  if (nameSpan) nameSpan.textContent = name || "—";
  if (rutSpan) rutSpan.textContent = rut || "—";
  if (emailSpan) emailSpan.textContent = email || "—";
  if (phoneSpan) phoneSpan.textContent = phone || "—";

 
  if (nameInp) nameInp.value = name;
  if (emailInp) emailInp.value = email;
  if (phoneInp) phoneInp.value = phone;

  
  editBtn.onclick = () => {
    viewBox.hidden = true;
    formBox.hidden = false;
  };

 
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      formBox.hidden = true;
      viewBox.hidden = false;
    };
  }

  
  formBox.onsubmit = (e) => {
    e.preventDefault();

    const newName  = nameInp?.value.trim() || "";
    const newEmail = emailInp?.value.trim() || "";
    const newPhone = phoneInp?.value.trim() || "";

   
    const updated = {
      ...user,
      name: newName,
      email: newEmail,
      phone_number: newPhone,
    };

    localStorage.setItem("user", JSON.stringify(updated));

    
    if (nameSpan) nameSpan.textContent = newName || "—";
    if (emailSpan) emailSpan.textContent = newEmail || "—";
    if (phoneSpan) phoneSpan.textContent = newPhone || "—";

    formBox.hidden = true;
    viewBox.hidden = false;
  };
}

/****************************************************
 * PANEL KINESIÓLOGO
 * - Próximas consultas
 * - Confirmar/Cancelar
 * - Comentar sesión (marca completed)
 ****************************************************/

function getAuthToken() {
  return localStorage.getItem("authToken");
}

function authHeadersJson() {
  const token = getAuthToken();
  return withNgrokHeader({
    "Content-Type": "application/json",
    "Authorization": `Token ${token}`,
  });
}


/****************************************************
 * KINE PERFIL (kine_perfil.html)
 ****************************************************/
async function initKineProfilePage() {
  const page = document.body?.dataset?.page;
  if (page !== "kine-perfil") return;

  const token = localStorage.getItem("authToken");
  const user = getStoredUser();

  if (!token) {
    window.location.href = "ingreseAqui.html";
    return;
  }

  // Si el rol no está en localStorage, NO redirigimos: dejamos que el backend responda 403 y mostramos mensaje.
  if (!isKineUser(user)) {
    const msgEl = document.querySelector("[data-kine-profile-msg]");
    if (msgEl) msgEl.textContent = "Acceso restringido (rol no detectado en sesión).";
  }

  // UI (resumen)
  const nameEl  = document.querySelector("[data-kine-profile-name]");
  const emailEl = document.querySelector("[data-kine-profile-email]");
  const phoneEl = document.querySelector("[data-kine-profile-phone]");
  const rutEl   = document.querySelector("[data-kine-profile-rut]");

  // UI (form)
  const form = document.querySelector("[data-kine-profile-form]");
  const emailInp = document.querySelector("[data-kine-profile-email-input]");
  const phoneInp = document.querySelector("[data-kine-profile-phone-input]");
  const passInp  = document.querySelector("[data-kine-profile-pass-input]");
  const pass2Inp = document.querySelector("[data-kine-profile-pass2-input]");
  const cancelBtn = document.querySelector("[data-kine-profile-cancel]");
  const msgEl = document.querySelector("[data-kine-profile-msg]");

  const setMsg = (t = "") => { if (msgEl) msgEl.textContent = t; };

  // ⚠️ Endpoint sugerido (ajústalo si tu backend usa otro)
  const PROFILE_URL = `${BASE_URL}api/kinesiologist/profile/`;

  async function loadProfile() {
    setMsg("Cargando perfil...");
    try {
      const res = await fetch(PROFILE_URL, {
        headers: withNgrokHeader({
          "Authorization": `Token ${token}`,
        }),
      });

      if (res.status === 403) {
        setMsg("Acceso denegado.");
        return;
      }
      if (!res.ok) {
        setMsg("No se pudo cargar el perfil.");
        return;
      }

      const data = await res.json();

      const name  = data.name || data.full_name || user?.name || "—";
      const email = data.email || user?.email || "—";
      const phone = data.phone_number || data.phone || user?.phone_number || "—";
      const rut   = data.rut || user?.rut || "—";

      if (nameEl) nameEl.textContent = name;
      if (emailEl) emailEl.textContent = email;
      if (phoneEl) phoneEl.textContent = phone;
      if (rutEl) rutEl.textContent = rut;

      if (emailInp) emailInp.value = email === "—" ? "" : email;
      if (phoneInp) phoneInp.value = phone === "—" ? "" : phone;

      setMsg("");
    } catch (e) {
      console.error(e);
      setMsg("Error de red cargando perfil.");
    }
  }

  function resetPasswords() {
    if (passInp) passInp.value = "";
    if (pass2Inp) pass2Inp.value = "";
  }

  cancelBtn?.addEventListener("click", () => {
    resetPasswords();
    loadProfile();
    setMsg("");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newEmail = (emailInp?.value || "").trim();
    const newPhone = (phoneInp?.value || "").trim();
    const p1 = (passInp?.value || "").trim();
    const p2 = (pass2Inp?.value || "").trim();

    if (p1 || p2) {
      if (p1.length < 6) return setMsg("La contraseña debe tener al menos 6 caracteres.");
      if (p1 !== p2) return setMsg("Las contraseñas no coinciden.");
    }

    setMsg("Guardando...");

    const payload = {
      email: newEmail || null,
      phone_number: newPhone || null,
    };
    if (p1) payload.password = p1;

    try {
      const res = await fetch(PROFILE_URL, {
        method: "PATCH", // cambia a PUT si tu API lo exige
        headers: withNgrokHeader({
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.detail || data.message || "No se pudo guardar.");
        return;
      }

      resetPasswords();
      setMsg("Cambios guardados.");
      await loadProfile();
    } catch (e) {
      console.error(e);
      setMsg("Error de red guardando perfil.");
    }
  });

  await loadProfile();
}



/****************************************************
 * KINE HORARIO (kine_horario.html)
 ****************************************************/
async function initKineHorarioPage() {
  const page = document.body?.dataset?.page;
  if (page !== "kine-horario") return;

  const token = localStorage.getItem("authToken");
  const user = getStoredUser();
  if (!token) {
    window.location.href = "ingreseAqui.html";
    return;
  }

  // Si el rol no está en localStorage, NO redirigimos: dejamos que el backend responda 403 y mostramos mensaje.
  if (!isKineUser(user)) {
    const msgEl = document.querySelector("[data-kine-avail-msg]");
    if (msgEl) msgEl.textContent = "Acceso restringido (rol no detectado en sesión).";
  }

  const dayButtons = Array.from(document.querySelectorAll("[data-kine-day]"));
  const startInp = document.querySelector("[data-kine-avail-start]");
  const endInp = document.querySelector("[data-kine-avail-end]");
  const addBtn = document.querySelector("[data-kine-avail-add]");
  const listEl = document.querySelector("[data-kine-avail-list]");
  const template = document.querySelector(".list__item--template");
  const clearBtn = document.querySelector("[data-kine-avail-clear]");
  const saveBtn = document.querySelector("[data-kine-avail-save]");
  const msgEl = document.querySelector("[data-kine-avail-msg]");

  const setMsg = (t="") => { if (msgEl) msgEl.textContent = t; };

  // Estado local
  let selectedDay = "mon";
  let blocksByDay = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  // ⚠️ Endpoints sugeridos (ajústalos si tu backend usa otros)
  const AVAIL_URL = (kineId) => `${BASE_URL}api/kinesiologists/${kineId}/availability/`;

  function normalizeBlocks(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.blocks)) return data.blocks;
    if (data?.availability && typeof data.availability === "object") return data.availability[selectedDay] || [];
    return [];
  }

  function renderDay(dayKey) {
    if (!listEl || !template) return;

    const blocks = blocksByDay[dayKey] || [];
    listEl.innerHTML = "";

    if (!blocks.length) {
      listEl.innerHTML = `<div class="empty">Sin bloques aún</div>`;
      return;
    }

    blocks.forEach((b, idx) => {
      const node = template.cloneNode(true);
      node.hidden = false;
      node.classList.remove("list__item--template");
      node.classList.add("list__item");

      const content = node.querySelector(".list__content");
      const rm = node.querySelector("[data-kine-avail-remove]");

      const s = String(b.start || b.start_time || "").slice(0,5);
      const e = String(b.end || b.end_time || "").slice(0,5);

      if (content) content.textContent = `${s} - ${e}`;
      rm?.addEventListener("click", () => {
        blocksByDay[dayKey].splice(idx, 1);
        renderDay(dayKey);
      });

      listEl.appendChild(node);
    });
  }

  function isValidRange(start, end) {
    if (!start || !end) return false;
    return start < end; // "09:00" < "10:00"
  }

  async function loadDayFromBackend(dayKey) {
    const token = localStorage.getItem("authToken");
    const user = getStoredUser();
    const kineId = user?.id;
    if (!token || !kineId) return;

    setMsg("Cargando disponibilidad...");

    const dayMap = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
    const targetDayInt = dayMap[dayKey];

    try {
      const res = await fetch(`${BASE_URL}api/kinesiologists/${kineId}/availability/`, {
        headers: {
          "Authorization": `Token ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!res.ok) {
        setMsg("No se pudo cargar (revisa endpoint de disponibilidad).");
        return;
      }

      const data = await res.json();

      // En tu backend, este GET devuelve: { kinesiologist, availability: [...], appointments: [...] }
      const items = Array.isArray(data) ? data : (data.availability || []);

      blocksByDay[dayKey] = (items || [])
  .filter(b => b.day === targetDayInt)
  .map(b => ({
    start: String(b.start_time || "").slice(0, 5),
    end:   String(b.end_time   || "").slice(0, 5),
  }))
  .filter(b => b.start && b.end);


      setMsg("");
      renderDay(dayKey);
    } catch (err) {
      console.error(err);
      setMsg("Error de red cargando disponibilidad.");
    }
  }

  async function saveAllToBackend() {
    const token = localStorage.getItem("authToken");
    const user = getStoredUser();
    const kineId = user?.id;

    if (!token) {
      setMsg("Debes iniciar sesión.");
      return;
    }
    if (!kineId) {
      setMsg("No se encontró el id del kinesiólogo en la sesión.");
      return;
    }

    setMsg("Guardando disponibilidad...");

    try {
      // ✅ BULK: el backend acepta { availability: { mon:[{start,end}], ... } }
      const payload = { availability: blocksByDay };

      const res = await fetch(`${BASE_URL}api/kinesiologists/${kineId}/availability/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_e) {
        data = { raw: text };
      }

      if (!res.ok) {
        console.error("SAVE AVAIL ERROR:", res.status, data);
        setMsg(data.message || data.detail || "No se pudo guardar disponibilidad.");
        return;
      }

      setMsg(data.message || "Disponibilidad guardada.");
      await loadDayFromBackend(selectedDay);
    } catch (e) {
      console.error(e);
      setMsg("Error de red guardando disponibilidad.");
    }
  }

  // Selección de día
  dayButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      dayButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      selectedDay = btn.dataset.kineDay || "mon";
      renderDay(selectedDay);
      await loadDayFromBackend(selectedDay);
    });
  });

  // Agregar bloque
  addBtn?.addEventListener("click", () => {
    const start = startInp?.value || "";
    const end = endInp?.value || "";

    if (!isValidRange(start, end)) {
      setMsg("Rango inválido. Asegúrate que inicio sea menor que fin.");
      return;
    }

    const blocks = blocksByDay[selectedDay] || [];
    blocks.push({ start, end });
    blocks.sort((a,b) => String(a.start).localeCompare(String(b.start)));

    blocksByDay[selectedDay] = blocks;
    setMsg("");
    renderDay(selectedDay);
  });

  clearBtn?.addEventListener("click", () => {
    blocksByDay[selectedDay] = [];
    renderDay(selectedDay);
    setMsg("Día limpiado (recuerda guardar).");
  });

  saveBtn?.addEventListener("click", async () => {
    await saveAllToBackend();
  });

  // Boot inicial
  const monBtn = dayButtons.find(b => b.dataset.kineDay === "mon");
  monBtn?.classList.add("is-active");
  renderDay(selectedDay);
  await loadDayFromBackend(selectedDay);
}


/****************************************************
 * Boot
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  initKineHorarioPage();

  initKineProfilePage();

  initKineDirectory();
  initSchedulePage();
  initLoginSystem();
  initPatientDataPage();
  initConfirmacionPage();
  initPatientHistoryPage();
  initHistoryViews();
  initProfilePage();
  loadPatientProfile();

  // ✅ Panel Kine como página independiente
  if (document.body?.dataset?.page === "panelkine") {
    initKinePanelView();
  }
});


