const CONTACTS = [
    { platform: "Discord",     handle: "unity59397",    accent: "#5865F2", type: "copy", icon: "discord" },
    { platform: "Epic Games",  handle: "Unity59397",     accent: "#313131", type: "copy", icon: "epicgames" },
    { platform: "Xbox",        handle: "Unity5#9397", accent: "#107C10", type: "copy", icon: "xbox" },
    { platform: "EA",          handle: "Unity5_9397",     accent: "#E31B23", type: "copy", icon: "ea" },
    { platform: "Rockstar",    handle: "Unity5_9397",     accent: "#FCAF17", type: "copy", icon: "rockstargames" },
    { platform: "Roblox",      handle: "Damocles",     accent: "#00A2FF", type: "link",url:"https://www.roblox.com/users/1634450608/profile", icon: "roblox" },
    { platform: "Riot Games",  handle: "Unity5#9397", accent: "#D32936", type: "copy", icon: "riotgames" }
];

// Add a second account here if you want it on the main Contacts list too.
// Leave this array empty to hide the section below the platform list.
const ALT_ACCOUNT = [
    { platform: "Steam (Alt)", handle: "[CVR] Unity", accent: "#8b6bff", type: "link",url:"https://steamcommunity.com/profiles/76561199798911009/", icon: "steam" }
];

/*RENDER*/

function buildContactCard(entry, index) {

    const card = document.createElement("div");
    card.className = "contact-card";
    card.style.setProperty("--accent", entry.accent);
    card.style.setProperty("--card-delay", `${Math.min(index, 10) * 0.05}s`);

    const iconUrl = `https://api.iconify.design/simple-icons/${entry.icon}.svg`;

    const actionHtml = entry.type === "link"
        ? `<a href="${entry.url}" target="_blank" rel="noopener" class="contact-action">Visit profile</a>`
        : `<button type="button" class="contact-action contact-copy" data-handle="${entry.handle}">Copy tag</button>`;

    card.innerHTML = `
        <div class="contact-badge">
            <span class="contact-icon" style="-webkit-mask-image:url('${iconUrl}'); mask-image:url('${iconUrl}');"></span>
        </div>
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

/*COPY TO CLIPBOARD*/

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
