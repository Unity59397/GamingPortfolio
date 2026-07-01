const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
console.log("Loaded key?", !!process.env.STEAM_KEY, "Loaded id?", !!process.env.STEAM_ID);
console.log("Loaded DATABASE_URL?", !!process.env.DATABASE_URL);

const app = express();
app.use(cors());
app.use(express.json());

const KEY = process.env.STEAM_KEY;
const STEAM_ID = process.env.STEAM_ID;

/* ---------------- POSTGRES ----------------
   Replaces the old JSON-file store. Render's free Postgres instances
   require SSL, and Render's own connection strings use a self-signed
   cert chain, so `rejectUnauthorized: false` is expected here (this
   is normal for Render-to-Render connections, not a security downgrade
   you introduced). */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY DEFAULT 1,
            count INTEGER NOT NULL DEFAULT 0
        );
    `);

    // Seed the single likes row if it doesn't exist yet
    await pool.query(`
        INSERT INTO likes (id, count)
        VALUES (1, 0)
        ON CONFLICT (id) DO NOTHING;
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);

    console.log("Database ready");
}

initDb().catch(err => {
    console.error("Failed to initialize database:", err);
});

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

app.get("/api/likes", async (req, res) => {
    try {
        const result = await pool.query("SELECT count FROM likes WHERE id = 1");
        res.json({ count: result.rows[0]?.count ?? 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't load likes" });
    }
});

app.post("/api/likes", async (req, res) => {

    const action = req.body && req.body.action;

    if (action !== "like" && action !== "unlike") {
        return res.status(400).json({ error: "action must be 'like' or 'unlike'" });
    }

    try {
        const delta = action === "like" ? 1 : -1;

        const result = await pool.query(
            `UPDATE likes
             SET count = GREATEST(count + $1, 0)
             WHERE id = 1
             RETURNING count`,
            [delta]
        );

        res.json({ count: result.rows[0].count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't update likes" });
    }
});

/* ---------------- COMMENTS ---------------- */

app.get("/api/comments", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, message, created_at AS "createdAt"
             FROM comments
             ORDER BY created_at ASC`
        );
        res.json({ comments: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't load comments" });
    }
});

app.post("/api/comments", async (req, res) => {

    const name = (req.body && req.body.name || "").toString().trim();
    const message = (req.body && req.body.message || "").toString().trim();

    if (!name || !message) {
        return res.status(400).json({ error: "name and message are required" });
    }

    if (name.length > 40 || message.length > 280) {
        return res.status(400).json({ error: "name or message too long" });
    }

    try {
        await pool.query(
            `INSERT INTO comments (name, message) VALUES ($1, $2)`,
            [name, message]
        );
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't save comment" });
    }
});

// Only requests carrying the correct x-admin-key header can delete a
// comment. Set ADMIN_KEY as an environment variable on Render (same way
// as STEAM_KEY) — pick any long random string, it's just a shared secret
// between you and the server, not a login system.
app.delete("/api/comments/:id", async (req, res) => {

    const providedKey = req.get("x-admin-key");

    if (!process.env.ADMIN_KEY || providedKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid comment id" });
    }

    try {
        const result = await pool.query(
            `DELETE FROM comments WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Couldn't delete comment" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
