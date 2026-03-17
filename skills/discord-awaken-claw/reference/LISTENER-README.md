# Discord Listener - Auto-Trigger Awakening

This listener process causes the Bot to automatically send an awakening guide message whenever it is added to a **private text channel**.

---

## 🚀 Quick Start

```bash
# Enter directory
cd /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference

# Start listener
./start-listener.sh start

# Check status
./start-listener.sh status

# View logs
./start-listener.sh logs

# Stop
./start-listener.sh stop

# Restart
./start-listener.sh restart
```

---

## 📋 Features

### Auto-trigger scenarios

| Scenario | Trigger condition | Behavior |
|----------|------------------|----------|
| **Private channel created** | User creates a private text channel in the server and invites the Bot | Bot automatically sends awakening guide message + button |
| **Bot joins a server** | Bot is invited to a new Discord server | Bot sends guide message in the system channel or the first available channel |

### Scenarios that do NOT trigger

| Scenario | Reason |
|----------|--------|
| Public channel | No permission overrides |
| Voice channel | Only listens to text channels (type 0 and 5) |
| Already-seen channel | Prevents re-triggering (tracked via `_seenChannels`) |

---

## 🔧 Configuration

### Environment variables (`.env` file)

```bash
# Discord Bot Token (required)
DISCORD_TOKEN=your_bot_token

# Server ID (optional, used for log display)
GUILD_ID=your_server_id

# Neta API Token (optional, used for avatar search)
# NETA_TOKEN=...
```

### Permission requirements

The Bot requires the following permissions:

- **View Channels**
- **Send Messages**
- **Read Message History**
- **Embed Links**
- **Attach Files**

---

## 📊 Log examples

### Successful startup
```
✅ Listener started: LobsterBaby#8879
   Listening on server: 1480912787814350868

💡 The Bot will now automatically trigger the awakening flow when added to a private text channel
```

### Channel creation trigger
```
[channel created] 1483241408717652208 test-channel
[sent successfully] ○  Lobster Baby · Waiting to hatch...
```

### Skipping a public channel
```
[skipped] public channel: 1483241408717652209
```

---

## 🛠️ Troubleshooting

### Issue: Process fails to start

**Check logs:**
```bash
./start-listener.sh logs
```

**Common errors:**
- `❌ Missing DISCORD_TOKEN` → Check that the `.env` file exists and is configured correctly
- `Error: Cannot find module 'discord.js'` → Run `npm install`

### Issue: Channel created but awakening not triggered

**Possible causes:**
1. Channel is public (no permission overrides)
2. Channel type is not text (is voice or category)
3. Bot does not have send message permission in the channel

**Solutions:**
- Ensure the channel is private (set permissions to allow only specific users/roles)
- Ensure the Bot has send message permission in the channel

### Issue: Repeated triggering

The listener uses `_seenChannels` to record already-processed channels and prevent re-triggering.

If you need to re-trigger during testing:
1. Delete the `state.json` file
2. Or delete and recreate the channel

---

## 📁 File descriptions

| File | Purpose |
|------|---------|
| `channel-listener.js` | Listener main program |
| `start-listener.sh` | Start/stop/management script |
| `.env` | Environment variable configuration |
| `channel-listener.pid` | Process ID file (auto-created) |
| `channel-listener.log` | Log file (auto-created) |
| `direct-handler.js` | Awakening logic handler (called by listener) |

---

## 🔁 Relationship with OpenClaw

**The listener is an independent Discord bot process** that does not depend on OpenClaw to run.

```
┌─────────────────────┐         ┌─────────────────────┐
│  Discord Gateway    │         │   OpenClaw Agent    │
│  (real-time events) │         │  (reactive handler) │
└──────────┬──────────┘         └──────────┬──────────┘
           │                                │
           ▼                                │
┌─────────────────────┐                     │
│  channel-listener   │                     │
│  (Node.js process)  │─────────────────────┘
│  listens → calls handler │    triggered by user messages
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  direct-handler.js  │
│  (awakening logic)  │
└─────────────────────┘
```

**How they work together:**
- **Listener**: handles Discord real-time events (channel creation, member join, etc.)
- **OpenClaw**: handles user-initiated messages (@Bot start awakening, etc.)

Both can **run simultaneously** without conflict.

---

## 🎯 Testing

### Test 1: Create a private channel

1. Create a new channel in the Discord server
2. Set permissions: allow only specific users/roles (making it private)
3. Ensure the Bot has access to the channel
4. Check logs: should see `[channel created]` and `[sent successfully]`

### Test 2: Invite Bot to a new server

1. Generate an OAuth2 invite link from the Discord Developer Portal
2. Invite the Bot to a new test server
3. Check logs: should see `[joined server]` and `[sent successfully]`

---

## 📝 Notes

1. **Do not run multiple listener instances simultaneously** - will cause duplicate messages
2. **Check logs regularly** - ensure the process is running correctly
3. **Token security** - do not commit the `.env` file to Git
4. **Process management** - use the `start-listener.sh` script; do not start directly with `node`

---

## 🆘 Need help?

View full logs:
```bash
tail -f /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference/channel-listener.log
```

Check process status:
```bash
ps aux | grep channel-listener
```

Manual test (foreground):
```bash
cd /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference
node channel-listener.js
```
