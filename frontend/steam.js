/* ---------------- CONFIG ---------------- */

// Add the Steam appids of your favorite games here.
// Find an appid in a game's Steam store URL, e.g.
// store.steampowered.com/app/730/  ->  730 is Counter-Strike 2's appid
const FAVORITE_APPIDS = [
    730,1771300,1222140,379430 
];

let allGames = [];
let currentProfile = null;

async function loadSteam() {

    const res = await fetch("https://gamingportfolio.onrender.com");
    const data = await res.json();

    console.log("DATA RECEIVED:", data);

    allGames = data.games || [];
    currentProfile = data.profile || null;

    renderHeader();
    renderFavorites();
    renderGames(allGames);
}

/* ---------------- HEADER ---------------- */

function renderHeader() {

    const container = document.querySelector(".container");

    const old = document.querySelector(".steam-header");
    if (old) old.remove();

    const totalMinutes = allGames.reduce(
        (sum, g) => sum + (g.playtime_forever || 0),
        0
    );

    const hours = (totalMinutes / 60).toFixed(1);

    let status = "⚪ Not currently in a game";

    if (currentProfile && currentProfile.gameextrainfo) {
        status = `🟢 Playing: ${currentProfile.gameextrainfo}`;
    }

    const header = document.createElement("div");
    header.className = "steam-header";

    header.innerHTML = `
        <div>${status}</div>
        <div>Total playtime: ${hours} hrs</div>
    `;

    container.prepend(header);
}

/* ---------------- FAVORITES ---------------- */

function renderFavorites() {

    const section = document.getElementById("favorites-section");
    const container = document.getElementById("favorites");

    const favoriteGames = allGames.filter(g =>
        FAVORITE_APPIDS.includes(g.appid)
    );

    if (favoriteGames.length === 0) {
        section.hidden = true;
        return;
    }

    section.hidden = false;
    container.innerHTML = "";
    favoriteGames.forEach((game, i) => container.appendChild(buildCard(game, true, i)));
}

/* ---------------- GAMES ---------------- */

function buildCard(game, isFavorite, index = 0) {

    const hours = (game.playtime_forever / 60).toFixed(1);
    const img = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;

    const card = document.createElement("div");
    card.className = "game-card";
    card.style.setProperty("--card-delay", `${Math.min(index, 14) * 0.04}s`);

    card.innerHTML = `
        ${isFavorite ? `<div class="fav-badge">★</div>` : ""}
        <img src="${img}" alt="" onerror="this.style.display='none'">
        <div class="game-info">
            <h3>${game.name}</h3>
            <p>${hours} hrs</p>
        </div>
    `;

    return card;
}

function renderGames(games) {

    const container = document.getElementById("games");
    const countLabel = document.getElementById("library-count");

    container.innerHTML = "";
    countLabel.textContent = `${games.length} game${games.length === 1 ? "" : "s"}`;

    if (games.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No games match that search.";
        container.appendChild(empty);
        return;
    }

    games.forEach((game, i) => {
        const isFavorite = FAVORITE_APPIDS.includes(game.appid);
        container.appendChild(buildCard(game, isFavorite, i));
    });
}

/* ---------------- SMOOTH RE-RENDER ---------------- */

// Briefly fades the grid out, swaps the content, then fades the new
// (staggered) cards back in — used on search and sort changes.
function transitionRenderGames(games) {

    const container = document.getElementById("games");
    container.classList.add("is-swapping");

    window.setTimeout(() => {
        renderGames(games);
        container.classList.remove("is-swapping");
    }, 160);
}

/* ---------------- SEARCH ---------------- */

document.getElementById("search").addEventListener("input", (e) => {

    const value = e.target.value.toLowerCase();

    const filtered = allGames.filter(g =>
        g.name.toLowerCase().includes(value)
    );

    transitionRenderGames(filtered);
});

/* ---------------- SORT ---------------- */

document.getElementById("sort").addEventListener("change", (e) => {

    let sorted = [...allGames];

    if (e.target.value === "hours") {
        sorted.sort((a, b) =>
            b.playtime_forever - a.playtime_forever
        );
    }

    if (e.target.value === "az") {
        sorted.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    if (e.target.value === "za") {
        sorted.sort((a, b) =>
            b.name.localeCompare(a.name)
        );
    }

    transitionRenderGames(sorted);
});

loadSteam();

/* ---------------- DISCORD COPY ---------------- */

const discordBtn = document.getElementById("discord-copy");

if (discordBtn) {
    discordBtn.addEventListener("click", () => {
        const username = discordBtn.dataset.username;
        navigator.clipboard.writeText(username);

        const label = document.getElementById("discord-label");
        const original = label.textContent;
        label.textContent = "Copied!";

        setTimeout(() => {
            label.textContent = original;
        }, 1500);
    });
}