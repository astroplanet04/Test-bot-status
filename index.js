/* Made By Milcon Development

  Discord: https://dsc.gg/milcondev
  Website: https://milcon.hs.vc 

*/

require("dotenv").config();
// AGGIUNTO: ButtonBuilder, ActionRowBuilder, ButtonStyle per i bottoni
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
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

// Nuove costanti per i bottoni
const WEBSITE_URL = 'https://brevthcraft.net';
const DISCORD_CHANNEL_URL = 'https://discord.com/channels/1333206767785742408/1352014121641574410';
const COPY_IP_LABEL = 'mc.brevthcraft.net';

let statusMessage = null;
let lastStatus = null; // Track last known status

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    // Avviamo il primo aggiornamento immediatamente e poi impostiamo il timer
    updateServerStatus();
    setInterval(updateServerStatus, 10000); // Auto-update every 10 sec

    // Cerchiamo/Creiamo il messaggio iniziale
    await fetchOrCreateStatusMessage(); 
});

// Gestione dei Bottoni (Interazioni)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    // Controlla se l'ID personalizzato è quello del bottone 'copy_ip'
    if (interaction.customId === 'copy_ip') {
        
        // Invia una risposta temporanea e nascosta all'utente
        await interaction.reply({ 
            content: `Copia l'IP del server: \`${serverIP}\``, 
            ephemeral: true // Solo l'utente che ha cliccato vede questo messaggio
        });
    }
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

        // Get the player list (variabile creata ma non usata nell'embed finale)
        let playerList = "No players online.";
        if (response.players.sample && response.players.sample.length > 0) {
            playerList = response.players.sample.map(player => player.name).join(", ");
            if (playerList.length > 1024) {
                playerList = playerList.substring(0, 1020) + "..."; // Trim if too long
            }
        }

        // --- MODIFICA PER LA PULIZIA DELLA VERSIONE (FlameCord) ---
        const rawVersionName = response.version.name;
        let cleanVersionName = rawVersionName;

        // Tenta di isolare solo la parte numerica/intervallo
        const versionMatch = rawVersionName.match(/(\d+\.\w+\.?\w*-?\d*\.?\w*\.?\w*)/);
        
        if (versionMatch && versionMatch[0]) {
            cleanVersionName = versionMatch[0];
        } else {
             // Fallback: pulisce il testo tra parentesi (se il formato è diverso)
             cleanVersionName = rawVersionName.replace(/\s*\([^)]+\)/g, '');
        }
        // ------------------------------------------------------------------------

        // --- CREAZIONE DEI BOTTONI PER STATO ONLINE ---
        const websiteButton = new ButtonBuilder()
            .setLabel('Sito Web: BrevtChraft.net')
            .setStyle(ButtonStyle.Link) // Link reindirizza all'URL
            .setURL(WEBSITE_URL);

        const copyIpButton = new ButtonBuilder()
            .setLabel(`Copia IP: ${COPY_IP_LABEL}`)
            .setStyle(ButtonStyle.Primary) // Bottone interattivo (blu)
            .setCustomId('copy_ip'); // ID usato per gestire il click

        const channelButton = new ButtonBuilder()
            .setLabel('Canale Discord')
            .setStyle(ButtonStyle.Link)
            .setURL(DISCORD_CHANNEL_URL);

        const onlineRow = new ActionRowBuilder()
            .addComponents(websiteButton, copyIpButton, channelButton);
        // ------------------------------------------

        const embed = new EmbedBuilder()
            .setTitle("🟢 Minecraft Server Online")
            .setDescription(`🌍 **Server IP:** \`${serverIP}\``)
            .setColor("Green")
            .addFields(
                // Riga 1
                { name: "📝 Version", value: cleanVersionName, inline: true }, 
                { name: "👥 Players", value: `${response.players.online}/${response.players.max}`, inline: true },
                // Riga 2
                { name: "📊 Ping", value: `${response.roundTripLatency}ms`, inline: true }
                // Riga 3
                { name: "📶 Protocollo", value: response.version.protocol, inline: true },
                { 
                    name: "🕟 Ultimo Aggiorn.", 
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`, 
                    inline: true 
                },
                // Riga 4 (Campo completo)
                { name: "📢 MOTD", value: response.motd.clean || "No message", inline: false }
            )
            .setThumbnail(`https://api.mcsrvstat.us/icon/${serverIP}`)
            .setImage(`https://mcapi.us/server/image?theme=dark&ip=${serverIP}:${serverPort}`)
            .setFooter({ text: "Last updated", iconURL: "https://cdn-icons-png.flaticon.com/512/906/906361.png" })
            .setTimestamp();

        // Ensure the status message exists before editing
        if (!statusMessage) {
            console.log("⚠️ Status message missing! Resending...");
            await fetchOrCreateStatusMessage(); 
        }

        // AGGIUNTO: Invio del messaggio con i componenti (bottoni)
        try {
            await statusMessage.edit({ embeds: [embed], components: [onlineRow] });
        } catch (error) {
            console.log("⚠️ Status message might have been deleted, creating a new one...");
            await fetchOrCreateStatusMessage();
            await statusMessage.edit({ embeds: [embed], components: [onlineRow] });
        }

    } catch (error) {
        console.error("❌ Error fetching Minecraft server status:", error);

        if (lastStatus !== "offline") {
            console.log("❌ Server is offline, updating message...");
        }
        lastStatus = "offline";
        
        // --- CREAZIONE DEI BOTTONI PER STATO OFFLINE (Senza copia IP) ---
        const websiteButtonOffline = new ButtonBuilder()
            .setLabel('Sito Web: BrevtChraft.net')
            .setStyle(ButtonStyle.Link)
            .setURL(WEBSITE_URL);

        const channelButtonOffline = new ButtonBuilder()
            .setLabel('Canale Discord')
            .setStyle(ButtonStyle.Link)
            .setURL(DISCORD_CHANNEL_URL);
            
        const offlineRow = new ActionRowBuilder()
            .addComponents(websiteButtonOffline, channelButtonOffline);
        // ------------------------------------------

        const offlineEmbed = new EmbedBuilder()
            .setTitle("🔴 Minecraft Server Offline")
            .setDescription(`🚫 The server \`${serverIP}\` è attualmente offline o irraggiungibile.`)
            .setColor("Red")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/1828/1828843.png")
            .setTimestamp();

        if (!statusMessage) {
            console.log("⚠️ Status message missing! Resending...");
            await fetchOrCreateStatusMessage();
        }

        // AGGIUNTO: Invio del messaggio offline con i componenti
        try {
            await statusMessage.edit({ embeds: [offlineEmbed], components: [offlineRow] });
        } catch (error) {
            console.log("⚠️ Status message might have been deleted, creating a new one...");
            await fetchOrCreateStatusMessage();
            await statusMessage.edit({ embeds: [offlineEmbed], components: [offlineRow] });
        }
    }
}

// Generates a loading embed for when the bot starts
function generateLoadingEmbed() {
    return new EmbedBuilder()
        .setTitle("⏳ Fetching Minecraft server status...")
        .setColor("Yellow")
        .setDescription("Please wait while we fetch the latest server details.")
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
