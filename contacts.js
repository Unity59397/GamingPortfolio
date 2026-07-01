/* ---------------- CONFIG ----------------
   Fill in your real handles/links below.
   type: "link" -> shows a "Visit profile" button that opens `url`
   type: "copy" -> shows a "Copy tag" button that copies `handle`
   (most platforms don't offer public add-friend links, so "copy" is the honest default) */

const CONTACTS = [
    { platform: "Discord",     handle: "yourname",        accent: "#5865F2", type: "copy" },
    { platform: "Epic Games",  handle: "yourname",         accent: "#6b6b6b", type: "copy" },
    { platform: "Xbox",        handle: "yourGamertag",     accent: "#107C10", type: "copy" },
    { platform: "EA",          handle: "yourname",         accent: "#E31B23", type: "copy" },
    { platform: "Rockstar",    handle: "yourname",         accent: "#FCAF17", type: "copy" },
    { platform: "Roblox",      handle: "yourname",         accent: "#00A2FF", type: "copy" },
    { platform: "Riot Games",  handle: "yourname#TAG",     accent: "#D32936", type: "copy" }
];

// Add a second account here if you want it on the main Contacts list too.
// Leave this array empty to hide the section below the platform list.
const ALT_ACCOUNT = [
    { platform: "Steam (Alt)", handle: "yourAltProfileURLorHandle", accent: "#8b6bff", type: "copy" }
];

/* ---------------- RENDER ---------------- */

function buildContactCard(entry, index) {

    const card = document.createElement("div");
    card.className = "contact-card";
    card.style.setProperty("--accent", entry.accent);
    card.style.setProperty("--card-delay", `${Math.min(index, 10) * 0.05}s`);

    const initial = entry.platform.trim().charAt(0).toUpperCase();

    const actionHtml = entry.type === "link"
        ? `<a href="${entry.url}" target="_blank" rel="noopener" class="contact-action">Visit profile</a>`
        : `<button type="button" class="contact-action contact-copy" data-handle="${entry.handle}">Copy tag</button>`;

    card.innerHTML = `
        <div class="contact-badge">${initial}</div>
        <div class="contact-info">
            <h3>${entry.platform}</h3>
            <p>${entry.handle}</p>
        </div>
        ${actionHtml}
    `;

    return card;
}

function renderGrid(containerId, entries) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    entries.forEach((entry, i) => container.appendChild(buildContactCard(entry, i)));
}

renderGrid("contacts", CONTACTS);

const altSection = document.querySelector(".alt-account-section");
if (ALT_ACCOUNT.length === 0) {
    if (altSection) altSection.hidden = true;
} else {
    renderGrid("alt-account", ALT_ACCOUNT);
}

/* ---------------- COPY TO CLIPBOARD ---------------- */

document.body.addEventListener("click", (e) => {

    const btn = e.target.closest(".contact-copy");
    if (!btn) return;

    navigator.clipboard.writeText(btn.dataset.handle);

    const original = btn.textContent;
    btn.textContent = "Copied!";
    btn.classList.add("is-copied");

    setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("is-copied");
    }, 1500);
});
