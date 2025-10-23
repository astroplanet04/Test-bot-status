# Minecraft Server Status Bot

Questo è un bot Discord basato su Node.js che monitora lo stato di un server Minecraft (Java/Bedrock) e aggiorna automaticamente un messaggio incorporato (Embed) in un canale Discord.

**Il bot fornisce le seguenti informazioni in tempo reale:**
* **Stato del Server** (Online/Offline)
* **Numero di Giocatori Online**
* **Lista dei Giocatori Online** (se disponibile)
* **Versione del Server e Ping**
* **MOTD** (Message of the Day)

---

## 🛠️ Setup e Configurazione

Segui questi passaggi per configurare il bot sui tuoi server.

### 1️⃣ Prerequisiti

Assicurati che **Node.js** sia installato sul sistema in cui vuoi eseguire il bot.

### 2️⃣ Installazione delle Dipendenze

Apri il terminale nella directory del bot (dove si trovano `package.json` e `index.js`) ed esegui:
```sh
npm install
````

*(Questo comando installerà tutte le librerie necessarie: `discord.js`, `dotenv`, e `minecraft-server-util`).*

### 3️⃣ Configurazione delle Variabili d'Ambiente

**IMPORTANTE:** Il bot legge la configurazione **ESCLUSIVAMENTE** dal file **`.env`**. Ignora il vecchio riferimento a `config.json`.

Modifica il file **`.env`** (già presente) e inserisci i tuoi valori specifici.

| Variabile | Descrizione |
| :--- | :--- |
| `DISCORD_TOKEN` | Il **Token** segreto del tuo bot Discord (dal Developer Portal). |
| `SERVER_IP` | L'**IP** o dominio del tuo server Minecraft. |
| `SERVER_PORT` | La **Porta** del tuo server Minecraft (default per Java: `25565`). |
| `CHANNEL_ID` | L'**ID del canale** Discord in cui il bot pubblicherà e aggiornerà lo stato. |
| `UPDATE_INTERVAL` | Intervallo di aggiornamento in **millisecondi** (consigliato: `1000` = 1 secondo). |

**Esempio di `.env` (Sostituisci i valori):**

```
DISCORD_TOKEN=IL_TUO_TOKEN_SEGRETO_DEL_BOT
SERVER_IP=mc.tuo-server.net
SERVER_PORT=25565
CHANNEL_ID=123456789012345678
UPDATE_INTERVAL=1000
```

### 4️⃣ Esecuzione del Bot

Avvia il bot con il comando:

```sh
node index.js
```

**Per l'esecuzione 24/7:** Per garantire che il bot rimanga online, si raccomanda l'uso di un gestore di processi come `pm2` o di un tool come `screen`/`tmux`.

-----

## 📝 Funzionalità e Troubleshooting

  * **Aggiornamento Continuo:** Il bot aggiorna il messaggio di stato in modo automatico all'intervallo specificato in `.env`.
  * **Resilience:** Se il messaggio di stato viene eliminato in Discord, il bot lo rileva e ne **ricrea uno nuovo** al ciclo di aggiornamento successivo.

### Problemi Comuni

  * **Bot non si avvia:** Controlla che tutte le variabili (`DISCORD_TOKEN`, `SERVER_IP`, `SERVER_PORT`, `CHANNEL_ID`) siano presenti e corrette nel file `.env`.
  * **Lo stato non si aggiorna:** Assicurati che il bot abbia i permessi necessari (`Invia Messaggi`, `Gestisci Messaggi/Embed Links`) nel canale specificato da `CHANNEL_ID`.
