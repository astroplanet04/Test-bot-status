# Minecraft Server Status Bot

This is a **premium Discord bot** that **tracks the status of a Minecraft server** and updates a message in a specific channel every 10 seconds. It shows:
- **Server status** (Online/Offline)
- **Number of players online**
- **List of online players**
- **Server version & ping**
- **MOTD (Message of the Day)**

---

## 📌 Features
✅ **Automatically updates every 10 seconds**  
✅ **Detects if the status message was deleted and re-sends it**  
✅ **Shows player names if available**  
✅ **Handles long player lists without crashing**  
✅ **Prevents bot crashes when the server is offline**  
✅ **Displays a server status image**  

---

---

## 📷 Example Output
![Minecraft Server Status Example](https://i.imgur.com/fQEvB2p.png)

---

## 🛠️ Setup

### 1️⃣ Install Dependencies
Make sure you have Node.js installed, then run:
```sh
npm install discord.js dotenv minecraft-server-util
```

### 2️⃣ Configure Settings
Create a `config.json` file in the bot's root directory and add:
```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "serverIP": "your-minecraft-server-ip",
  "serverPort": 25565,
  "channelID": "your-discord-channel-id"
}
```
Replace `YOUR_DISCORD_BOT_TOKEN`, `your-minecraft-server-ip`, and `your-discord-channel-id` with your actual values.

### 3️⃣ Run the Bot
```sh
node index.js
```

---

## 📝 Usage
- The bot will automatically **edit the last message** it sent to update the Minecraft server status.
- If the message gets deleted, it will **detect the deletion and resend it**.

---

## 🔧 Troubleshooting
### Bot Crashes on Startup
Make sure your `config.json` file is set up correctly and that you installed all dependencies.
```sh
npm install
```

### Bot Not Updating Status
- Check that the bot has **message editing permissions** in the channel.
- Ensure that `serverIP` and `channelID` are correct.

---

## ⚠️ License
This bot is **open source** but give us credits !

---

## 🛠️ Support

For any issues or inquiries, contact us on Discord: [Milcon Development](https://dsc.gg/milcondev)

---

## 👨‍💻 Author
Developed by **Milcon Development** 🚀

