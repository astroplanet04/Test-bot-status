/* Made By Milcon Development

  Discord: https://dsc.gg/milcondev
  Website: https://milcon.hs.vc 

*/

require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const util = require("minecraft-server-util");
const config = require("./config.json"); // Load config.json for local fallback

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Use environment variables with fallback to config.json
const token = process.env.DISCORD_TOKEN || config.token;
const serverIP = process.env.SERVER_IP || config.serverIP;
const serverPort = parseInt(process.env.SERVER_PORT || process.env.SERVER_PORT) || config.serverPort;
const channelID = process.env.CHANNEL_ID || config.channelID;

let statusMessage = null;
let lastStatus = null; // Track last known status

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    // Iniziamo l'aggiornamento in background prima di creare il messaggio
    // per ridurre il ritardo percepito.
    updateServerStatus();
    setInterval(updateServerStatus, 10000); // Auto-update every 10 sec

    // Cerchiamo/Creiamo il messaggio iniziale dopo aver avviato l'update
    await fetchOrCreateStatusMessage(); 
});

// Function to fetch or create the status message
async function fetchOrCreateStatusMessage() {
    try {
        const channel = await client.channels.fetch(channelID);
        if (!channel) {
            console.error("❌ Channel not found!");
            return;
        }

        // Fetch last 10 messages to find the bot's existing status message
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(msg => msg.author.id === client.user.id);

        if (botMessage) {
            console.log("🔄 Existing status message found, updating it...");
            statusMessage = botMessage;
        } else {
            console.log("📤 No existing message found, sending a new one...");
            statusMessage = await channel.send({ embeds: [generateLoadingEmbed()] });
        }
    } catch (error) {
        console.error("❌ Error fetching status message:", error);
    }
}

async function updateServerStatus() {
    try {
        const response = await util.status(serverIP, serverPort);

        if (lastStatus !== "online") {
            console.log("✅ Server is back online, updating message...");
        }
        lastStatus = "online";

        // Prepara l'array dei campi per l'embed
        const fields = [];

        // Costruisce la lista giocatori solo se presenti
        if (response.players.sample && response.players.sample.length > 0) {
            let playerList = response.players.sample.map(player => player.name).join("`, `");
            playerList = `\`${playerList}\``; // Aggiunge i backtick alla lista intera
            if (playerList.length > 1024) {
                playerList = playerList.substring(0, 1020) + "...`"; // Trim if too long
            }
            // *** IL CAMPO VIENE AGGIUNTO SOLO SE CI SONO GIOCATORI ***
            fields.push({ name: "🎮 Giocatori Online", value: playerList, inline: false });
        }
        // Il campo "Online Players" NON viene aggiunto se non ci sono giocatori.

        // --- INIZIO MODIFICA PER LA PULIZIA DELLA VERSIONE ---
        const rawVersionName = response.version.name;
        let cleanVersionName = rawVersionName;

        // Tenta di trovare e isolare solo la parte numerica/intervallo della versione
        const versionMatch = rawVersionName.match(/(\d+\.\w+\.?\w*-?\d*\.?\w*\.?\w*)/);
        
        if (versionMatch && versionMatch[0]) {
            cleanVersionName = versionMatch[0];
        } else {
             // Fallback: pulisce il testo tra parentesi (es. "(BungeeCord)")
             cleanVersionName = rawVersionName.replace(/\s*\([^)]+\)/g, '');
        }
        // --- FINE MODIFICA ---

        // Aggiunge i campi standard
        fields.push(
             // Usa la versione pulita (cleanVersionName)
            { name: "📝 Versione", value: `\`${cleanVersionName}\``, inline: true }, 
            { name: "👥 Massimi Giocatori", value: `**${response.players.online}** / ${response.players.max}`, inline: true },
            { name: "📊 Latenza (Ping)", value: `\`${response.roundTripLatency}ms\``, inline: true },
            { name: "📢 MOTD", value: response.motd.clean || "Nessun messaggio", inline: false }
        );

        const embed = new EmbedBuilder()
            // Titolo più descrittivo con l'IP
            .setTitle(`🟢 ${response.motd.clean.split('\n')[0] || "Minecraft Server Online"}`) 
            .setDescription(`**🌐 Indirizzo:** \`${serverIP}\``)
            .setColor("#57F287") // Green Discord standard
            .addFields(fields)
            .setThumbnail(`https://api.mcsrvstat.us/icon/${serverIP}`)
            .setImage(`https://mcapi.us/server/image?theme=dark&ip=${serverIP}:${serverPort}`)
            .setFooter({ text: `Ultimo aggiornamento: ${new Date().toLocaleTimeString()} (Ogni 10s)`, iconURL: "https://cdn-icons-png.flaticon.com/512/906/906361.png" })
            .setTimestamp();

        // Ensure the status message exists before editing
        if (!statusMessage) {
            console.log("⚠️ Status message missing! Resending...");
            // Non usiamo await qui per non bloccare il loop
            fetchOrCreateStatusMessage(); 
        }

        // If the message was deleted, create a new one before updating
        try {
            await statusMessage.edit({ embeds: [embed] });
        } catch (error) {
            console.log("⚠️ Status message might have been deleted, creating a new one...");
            await fetchOrCreateStatusMessage();
            // Tentativo di modifica dopo la ricreazione
            if (statusMessage) await statusMessage.edit({ embeds: [embed] }); 
        }

    } catch (error) {
        console.error("❌ Error fetching Minecraft server status:", error);

        if (lastStatus !== "offline") {
            console.log("❌ Server is offline, updating message...");
        }
        lastStatus = "offline";

        const offlineEmbed = new EmbedBuilder()
            .setTitle("🔴 Minecraft Server Offline")
            .setDescription(`🚫 Il server \`${serverIP}\` è attualmente spento o irraggiungibile.`)
            .setColor("#ED4245") // Red Discord standard
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/1828/1828843.png")
            .setTimestamp();

        if (!statusMessage) {
            console.log("⚠️ Status message missing! Resending...");
            await fetchOrCreateStatusMessage();
        }

        try {
            await statusMessage.edit({ embeds: [offlineEmbed] });
        } catch (error) {
            console.log("⚠️ Status message might have been deleted, creating a new one...");
            await fetchOrCreateStatusMessage();
            if (statusMessage) await statusMessage.edit({ embeds: [offlineEmbed] }); 
        }
    }
}

// Generates a loading embed for when the bot starts
function generateLoadingEmbed() {
    return new EmbedBuilder()
        .setTitle("⏳ Caricamento stato del server Minecraft...")
        .setColor("#FEE75C") // Yellow Discord standard
        .setDescription("Attendere prego mentre recuperiamo gli ultimi dettagli del server.")
        .setTimestamp();
}

// Start bot
client.login(token);

// Server HTTP per Render (risponde su / per evitare "No open ports detected")
const PORT = process.env.PORT || 3000;
const server = require('http').createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft Status Bot is running on Render!');
});
server.listen(PORT, () => {
    console.log(`Server HTTP attivo su porta ${PORT}`);
});

/* Made By Milcon Development

  Discord: https://dsc.gg/milcondev
  Website: https://milcon.hs.vc 

*/
