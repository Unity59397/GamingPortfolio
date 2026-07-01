const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
console.log("Loaded key?", !!process.env.STEAM_KEY, "Loaded id?", !!process.env.STEAM_ID);

const app = express();
app.use(cors());
app.use(express.json());

const KEY = process.env.STEAM_KEY;
const STEAM_ID = process.env.STEAM_ID;

/* ---------------- SIMPLE JSON-FILE DATA STORE ----------------
   Lightweight store for personal-scale traffic — reads/rewrites a JSON
   file on disk per request. NOTE: Render's free tier filesystem is
   ephemeral, so this data can reset when the service restarts/redeploys.
   Fine for now; swap for a real database (e.g. a free Postgres/Mongo tier)
   if you want likes/comments to persist long-term. */

const DATA_DIR = path.join(__dirname, "data");
const LIKES_FILE = path.join(DATA_DIR, "likes.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(LIKES_FILE)) {
        fs.writeFileSync(LIKES_FILE, JSON.stringify({ count: 0 }, null, 2));
    }
    if (!fs.existsSync(COMMENTS_FILE)) {
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2));
    }
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

ensureDataFiles();

// 🎮 Get owned games
async function getGames() {

    const url =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
        `?key=${KEY}` +
        `&steamid=${STEAM_ID}` +
        `&include_appinfo=true` +
        `&include_played_free_games=true`;

    const res = await axios.get(url);
    return res.data.response.games || [];
}

// 🟢 Get current status
async function getProfile() {

    const url =
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
        `?key=${KEY}&steamids=${STEAM_ID}`;

    const res = await axios.get(url);
    return res.data.response.players[0];
}

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Steam API backend running"
    });
});

app.get("/api/steam", async (req, res) => {
    try {
        const [games, profile] = await Promise.all([
            getGames(),
            getProfile()
        ]);

        res.json({
            games,
            profile
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Steam API failed" });
    }
});

/* ---------------- LIKES ---------------- */

app.get("/api/likes", (req, res) => {
    const data = readJson(LIKES_FILE);
    res.json(data);
});

app.post("/api/likes", (req, res) => {

    const action = req.body && req.body.action;

    if (action !== "like" && action !== "unlike") {
        return res.status(400).json({ error: "action must be 'like' or 'unlike'" });
    }

    const data = readJson(LIKES_FILE);
    data.count += action === "like" ? 1 : -1;
    if (data.count < 0) data.count = 0;

    writeJson(LIKES_FILE, data);
    res.json(data);
});

/* ---------------- COMMENTS ---------------- */

app.get("/api/comments", (req, res) => {
    const comments = readJson(COMMENTS_FILE);
    res.json({ comments });
});

app.post("/api/comments", (req, res) => {

    const name = (req.body && req.body.name || "").toString().trim();
    const message = (req.body && req.body.message || "").toString().trim();

    if (!name || !message) {
        return res.status(400).json({ error: "name and message are required" });
    }

    if (name.length > 40 || message.length > 280) {
        return res.status(400).json({ error: "name or message too long" });
    }

    const comments = readJson(COMMENTS_FILE);

    comments.push({
        name,
        message,
        createdAt: new Date().toISOString()
    });

    writeJson(COMMENTS_FILE, comments);
    res.status(201).json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
