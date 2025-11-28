/* 
🔥 MINECRAFT DASHBOARD v4.4 - DISCORD ONLY
📺 Public: Community status
🔧 Admin: Professional dashboard
✅ ZERO WEBSITE • MASSIMA STABILITÀ
*/

require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const util = require("minecraft-server-util");
const config = require("./config.json");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const token = process.env.DISCORD_TOKEN || config.token;
const serverIP = process.env.SERVER_IP || config.serverIP;
const serverPort = parseInt(process.env.SERVER_PORT) || config.serverPort;
const publicChannelID = process.env.CHANNEL_ID || config.channelID;
const adminChannelID = process.env.ADMIN_CHANNEL_ID || config.adminChannelID;

let publicMessage = null;
let adminMessage = null;
let lastStatus = null;
let statusHistory = [];
let updateCount = 0;
let startTime = Date.now();
let cacheBust = Date.now();

client.once("clientReady", async () => {  // ✅ FIX DEPRECATION WARNING
    startTime = Date.now();
    cacheBust = Date.now();
    
    console.log(`\n🚀 DASHBOARD v4.4 LIVE!`);
    console.log(`✅ ${client.user.tag}`);
    console.log(`🎮 ${serverIP}:${serverPort}`);
    console.log(`📺 Public: ${publicChannelID}`);
    console.log(`🔧 Admin: ${adminChannelID}\n`);
    
    updateServerStatus();
    setInterval(() => {
        cacheBust = Date.now();
        updateServerStatus();
    }, 10000);
    
    await Promise.all([
        initializeChannel(publicChannelID, "public"),
        initializeChannel(adminChannelID, "admin")
    ]);
    
    console.log(`✅ ✅ DISCORD DASHBOARD LIVE! • 10s refresh`);
});

async function initializeChannel(channelId, type) {
    try {
        const channel = await client.channels.fetch(channelId);
        const messages = await channel.messages.fetch({ limit: 5 });
        const botMessage = messages.find(msg => msg.author.id === client.user.id);

        if (botMessage) {
            if (type === "public") publicMessage = botMessage;
            if (type === "admin") adminMessage = botMessage;
            console.log(`✅ ${type.toUpperCase()} attached`);
        } else {
            const message = await channel.send({ embeds: [loadingEmbed(type)] });
            if (type === "public") publicMessage = message;
            if (type === "admin") adminMessage = message;
            console.log(`📤 ${type.toUpperCase()} deployed`);
        }
    } catch (error) {
        console.error(`❌ ${type.toUpperCase()}:`, error.message);
    }
}

async function updateServerStatus() {
    updateCount++;
    
    try {
        const response = await util.status(serverIP, serverPort);
        if (lastStatus !== "online") {
            console.log(`🟢 LIVE • ${response.players.online}/${response.players.max}`);
        }
        lastStatus = "online";

        const version = response.version.name.replace(/\s*\([^)]+\)/g, '').match(/(\d+\.\d+)/)?.[0] || response.version.name;
        const uptime = ((Date.now() - startTime) / 60000).toFixed(0);
        const avg = statusHistory.length ? (statusHistory.reduce((a, b) => a + b, 0) / statusHistory.length).toFixed(1) : 0;
        const load = ((response.players.online / response.players.max) * 100).toFixed(0);

        statusHistory.push(response.players.online);
        if (statusHistory.length > 24) statusHistory.shift();

        const iconUrl = `https://api.mcsrvstat.us/icon/${serverIP}?t=${cacheBust}`;
        const bannerUrl = `https://mcapi.us/server/image?theme=dark&ip=${serverIP}:${serverPort}&t=${cacheBust}`;

        // 📺 PUBLIC EMBED
        const publicEmbed = new EmbedBuilder()
            .setTitle("🟢 Minecraft Server Online")
            .setDescription(`🌍 **Server IP:** \`${serverIP}\``)
            .setColor(0x00ff00)
            .addFields(
                { name: "📝 Versione", value: version, inline: true },
                { name: "👥 Players", value: `${response.players.online}/${response.players.max}`, inline: true },
                { name: "📊 Ping", value: `${response.roundTripLatency}ms`, inline: true },
                { name: "📢 MOTD", value: response.motd.clean || "No message", inline: false }
            )
            .setThumbnail(iconUrl)
            .setImage(bannerUrl)
            .setFooter({ text: `Update #${updateCount} | Uptime: ${uptime}min` })
            .setTimestamp();

        // 🔧 ADMIN EMBED - PURA PROFESSIONALITÀ
        const adminEmbed = new EmbedBuilder()
            .setTitle("🔧 MINECRAFT SERVER - ADMIN DASHBOARD")
            .setDescription(`🟢 **LIVE** | **${response.players.online}/${response.players.max}** | **${response.roundTripLatency}ms** | **${version}**`)
            .setColor(0x00ff88)
            .addFields(
                { 
                    name: "📊 SYSTEM OVERVIEW", 
                    value: `**👥 PLAYERS ONLINE** • **${response.players.online}**
**🎛️ VERSION** • ${version}
**📡 MOTD** • ${response.motd.clean || "•"}`, 
                    inline: false 
                },
                { 
                    name: "📈 PERFORMANCE", 
                    value: `**⚡ PING** • ${response.roundTripLatency}ms
**📊 LOAD** • ${load}%
**📉 MEDIA** • ${avg} players
**⏱️ UPTIME** • ${uptime}min`, 
                    inline: true 
                },
                { 
                    name: "🔗 CONNECTION", 
                    value: `**🌐 IP** • \`${serverIP}:${serverPort}\`
**🔄 REFRESH** • #${updateCount}
**📡 STATUS** • **LIVE**`, 
                    inline: true 
                }
            )
            .setThumbnail(iconUrl)
            .setImage(bannerUrl)
            .setFooter({ 
                text: `🔧 ADMIN DASHBOARD | ${new Date().toLocaleTimeString('it-IT')} | Prossimo: +10s`, 
                iconURL: "https://cdn-icons-png.flaticon.com/512/2933/2933547.png"
            })
            .setTimestamp();

        await safeUpdate(publicMessage, publicEmbed, "PUBLIC");
        await safeUpdate(adminMessage, adminEmbed, "ADMIN");
        
        console.log(`✅ ${response.players.online}/${response.players.max} • ${load}% • #${updateCount}`);

    } catch (error) {
        if (lastStatus !== "offline") console.log(`🔴 OFFLINE`);
        lastStatus = "offline";

        const uptime = ((Date.now() - startTime) / 60000).toFixed(0);
        const avg = statusHistory.length ? (statusHistory.reduce((a, b) => a + b, 0) / statusHistory.length).toFixed(1) : 0;

        const iconUrl = `https://api.mcsrvstat.us/icon/${serverIP}?t=${cacheBust}`;
        const bannerUrl = `https://mcapi.us/server/image?theme=dark&ip=${serverIP}:${serverPort}&t=${cacheBust}`;

        const publicOffline = new EmbedBuilder()
            .setTitle("🔴 Minecraft Server Offline")
            .setDescription(`🚫 Server \`${serverIP}\` non raggiungibile`)
            .setColor(0xff4444)
            .addFields(
                { name: "📡 Connessione", value: "❌ Timeout", inline: true },
                { name: "👥 Players", value: "0/0", inline: true }
            )
            .setThumbnail(iconUrl)
            .setImage(bannerUrl)
            .setFooter({ text: `Update #${updateCount}` })
            .setTimestamp();

        const adminOffline = new EmbedBuilder()
            .setTitle("🔴 MINECRAFT SERVER - OFFLINE")
            .setDescription(`🚫 **${serverIP}:${serverPort}**`)
            .setColor(0xff4444)
            .addFields(
                { name: "👥 PLAYERS ONLINE", value: "**0**", inline: false },
                { name: "📈 ULTIMA MEDIA", value: `**${avg}** players`, inline: true },
                { name: "⚠️ STATUS", value: "**DOWN**", inline: true },
                { name: "⏱️ UPTIME BOT", value: `${uptime}min`, inline: true }
            )
            .setThumbnail(iconUrl)
            .setImage(bannerUrl)
            .setFooter({ text: `🔧 ADMIN DASHBOARD | Update #${updateCount}` })
            .setTimestamp();

        await safeUpdate(publicMessage, publicOffline, "PUBLIC");
        await safeUpdate(adminMessage, adminOffline, "ADMIN");
    }
}

async function safeUpdate(message, embed, type) {
    if (!message) return;
    try {
        await message.edit({ embeds: [embed] });
    } catch {
        console.log(`⚠️ ${type} lost • Auto-recovery`);
        if (type === "PUBLIC") await initializeChannel(publicChannelID, "public");
        if (type === "ADMIN") await initializeChannel(adminChannelID, "admin");
    }
}

function loadingEmbed(type) {
    const cacheBustLoad = Date.now();
    const iconUrlLoad = `https://api.mcsrvstat.us/icon/${serverIP}?t=${cacheBustLoad}`;
    const bannerUrlLoad = `https://mcapi.us/server/image?theme=dark&ip=${serverIP}:${serverPort}&t=${cacheBustLoad}`;

    return new EmbedBuilder()
        .setTitle(type === "admin" ? "🔧 ADMIN DASHBOARD" : "⏳ Connessione")
        .setDescription("Caricamento dati server...")
        .setColor(0xffaa00)
        .setThumbnail(iconUrlLoad)
        .setImage(bannerUrlLoad)
        .setTimestamp();
}

require('http').createServer((req, res) => {
    res.writeHead(200);
    res.end('🔧 DASHBOARD v4.4 LIVE - DISCORD ONLY');
}).listen(process.env.PORT || 3000);

client.login(token);