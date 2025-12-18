import { loadProfessionals } from "./request.js";

function formatPhone(number) {
  if (!number) return "No informado";
  const digits = String(number).replace(/[^0-9+]/g, "");
  if (digits.startsWith("+") || digits.startsWith("56")) return digits;
  return `+56 ${digits}`;
}

function buildDirectory(professionals) {
  const root = document.querySelector("[data-kine-directory]");
  if (!root) return;

  const list = root.querySelector("[data-kine-list]");
  const profile = root.querySelector("[data-kine-profile]");
  const empty = root.querySelector("[data-kine-empty]");
  const avatar = root.querySelector("[data-kine-avatar]");
  const nameEl = root.querySelector("[data-kine-name]");
  const specialtyEl = root.querySelector("[data-kine-specialty]");
  const rutEl = root.querySelector("[data-kine-rut]");
  const boxEl = root.querySelector("[data-kine-box]");
  const descriptionEl = root.querySelector("[data-kine-description]");
  const phoneEl = root.querySelector("[data-kine-phone]");
  const phoneLink = root.querySelector("[data-kine-phone-link]");
  const emailEl = root.querySelector("[data-kine-email]");
  const emailLink = root.querySelector("[data-kine-email-link]");

  if (!list || !profile || !empty) return;

  const renderProfile = (professional) => {
    if (!professional) return;

    empty.hidden = true;
    profile.hidden = false;

    const initials = professional.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    if (avatar) avatar.textContent = initials || "K";
    if (nameEl) nameEl.textContent = professional.name;
    if (specialtyEl) specialtyEl.textContent = professional.specialty;
    if (rutEl) rutEl.textContent = professional.rut ? `RUT ${professional.rut}` : "";
    if (boxEl) boxEl.textContent = professional.box || "Box no asignado";
    if (descriptionEl) descriptionEl.textContent = professional.description || "Sin descripción";

    const formattedPhone = formatPhone(professional.phone_number);
    if (phoneEl) phoneEl.textContent = formattedPhone;
    if (phoneLink) {
      const tel = professional.phone_number ? `tel:${professional.phone_number}` : "#";
      phoneLink.href = tel;
      phoneLink.setAttribute("aria-disabled", professional.phone_number ? "false" : "true");
    }

    if (emailEl) emailEl.textContent = professional.email || "";
    if (emailLink) {
      const mailto = professional.email ? `mailto:${professional.email}` : "#";
      emailLink.href = mailto;
      emailLink.setAttribute("aria-disabled", professional.email ? "false" : "true");
    }
  };

  const renderList = () => {
    list.innerHTML = "";

    professionals.forEach((professional, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "kine-directory__item";
      item.setAttribute("data-id", professional.id);
      item.setAttribute("aria-current", index === 0 ? "true" : "false");

      const itemAvatar = document.createElement("div");
      itemAvatar.className = "kine-directory__avatar";
      const initials = professional.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      itemAvatar.textContent = initials || "K";

      const textContainer = document.createElement("div");
      const name = document.createElement("h4");
      name.textContent = professional.name;
      const specialty = document.createElement("p");
      specialty.textContent = professional.specialty;
      textContainer.append(name, specialty);

      const chevron = document.createElement("span");
      chevron.className = "kine-directory__chevron";
      chevron.textContent = "›";

      item.append(itemAvatar, textContainer, chevron);

      item.addEventListener("click", () => {
        list.querySelectorAll("[aria-current]").forEach((el) => el.setAttribute("aria-current", "false"));
        item.setAttribute("aria-current", "true");
        renderProfile(professional);
      });

      list.appendChild(item);
    });
  };

  renderList();
  renderProfile(professionals[0]);
}

async function initDirectory() {
  const root = document.querySelector("[data-kine-directory]");
  if (!root) return;

  try {
    const professionals = await loadProfessionals();
    if (!Array.isArray(professionals) || professionals.length === 0) {
      const list = root.querySelector("[data-kine-list]");
      if (list) {
        list.innerHTML = "<p>No se encontraron kinesiólogos activos en el backend.</p>";
      }
      return;
    }

    buildDirectory(professionals);
  } catch (error) {
    const list = root.querySelector("[data-kine-list]");
    if (list) {
      list.innerHTML = `<p>Ocurrió un error al cargar el equipo: ${error.message}</p>`;
    }
  }
}

initDirectory();