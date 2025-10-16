/* Made By Milcon Development

  Discord : https://dsc.gg/milcondev
  website : https://milcon.hs.vc 

  */

require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const util = require("minecraft-server-util");
const config = require("./config.json"); // Load config.json

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const { token, serverIP, serverPort, channelID } = config; // Extract config values

let statusMessage = null;
let lastStatus = null; // Track last known status

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    await fetchOrCreateStatusMessage(); // Fetch or create message

    updateServerStatus();
    setInterval(updateServerStatus, 10000); // Auto-update every 10 sec
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

        // Get the player list
        let playerList = "No players online.";
        if (response.players.sample && response.players.sample.length > 0) {
            playerList = response.players.sample.map(player => player.name).join(", ");
            if (playerList.length > 1024) {
                playerList = playerList.substring(0, 1020) + "..."; // Trim if too long
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("🟢 Minecraft Server Online")
            .setDescription(`🌍 **Server IP:** \`${serverIP}\``)
            .setColor("Green")
            .addFields(
                { name: "📝 Version", value: response.version.name, inline: true },
                { name: "👥 Players", value: `${response.players.online}/${response.players.max}`, inline: true },
                { name: "📊 Ping", value: `${response.roundTripLatency}ms`, inline: true },
                { name: "🎮 Online Players", value: playerList, inline: false },
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

        // If the message was deleted, create a new one before updating
        try {
            await statusMessage.edit({ embeds: [embed] });
        } catch (error) {
            console.log("⚠️ Status message might have been deleted, creating a new one...");
            await fetchOrCreateStatusMessage();
            await statusMessage.edit({ embeds: [embed] });
        }

    } catch (error) {
        console.error("❌ Error fetching Minecraft server status:", error);

        if (lastStatus !== "offline") {
            console.log("❌ Server is offline, updating message...");
        }
        lastStatus = "offline";

        const offlineEmbed = new EmbedBuilder()
            .setTitle("🔴 Minecraft Server Offline")
            .setDescription(`🚫 The server \`${serverIP}\` is currently offline or unreachable.`)
            .setColor("Red")
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
            await statusMessage.edit({ embeds: [offlineEmbed] });
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






/* Made By Milcon Development

  Discord : https://dsc.gg/milcondev
  website : https://milcon.hs.vc 

  */