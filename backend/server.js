const express = require("express");
const axios = require("./node_modules/axios/index.d.cts");
const cors = require("cors");
require("dotenv").config();
console.log("Loaded key?", !!process.env.STEAM_KEY, "Loaded id?", !!process.env.STEAM_ID);

const app = express();
app.use(cors());

const KEY = process.env.STEAM_KEY;
const STEAM_ID = process.env.STEAM_ID;

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

// 🚀 Combined endpoint
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});