# Discord Listener - Auto-trigger Awakening

This listener process causes the Bot to automatically send an awakening prompt message when it is added to a **private text channel**.

---

## 🚀 Quick Start

```bash
# Navigate to the directory
cd /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference

# Start the listener
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

### Auto-trigger Scenarios

| Scenario | Trigger Condition | Behavior |
|----------|-------------------|----------|
| **Private channel created** | A user creates a private text channel on the server and invites the Bot | Bot automatically sends the awakening prompt + button |
| **Bot joins a server** | Bot is invited to a new Discord server | Bot sends the prompt in the system channel or the first available channel |

### Non-trigger Scenarios

| Scenario | Reason |
|----------|--------|
| Public channels | No permission overwrites |
| Voice channels | Only listens to text channels (type 0 and 5) |
| Already-seen channels | Prevents duplicate triggers (tracked with `_seenChannels`) |

---

## 🔧 Configuration

### Environment Variables (`.env` file)

```bash
# Discord Bot Token (required)
DISCORD_TOKEN=your_bot_token

# Server ID (optional, used for log display)
GUILD_ID=your_server_id

# Neta API Token (optional, used for avatar search)
# NETA_TOKEN=...
```

### Required Permissions

The Bot needs the following permissions:

- **View Channels**
- **Send Messages**
- **Read Message History**
- **Embed Links**
- **Attach Files**

---

## 📊 Log Examples

### Successful Start
```
✅ Listener started: LobsterBaby#8879
   Listening on server: 1480912787814350868

💡 The Bot will now automatically trigger the awakening flow when added to a private text channel
```

### Channel Creation Trigger
```
[channel created] 1483241408717652208 test-channel
[sent] ○  LobsterBaby · Waiting to hatch...
```

### Skipping Public Channel
```
[skip] public channel: 1483241408717652209
```

---

## 🛠️ Troubleshooting

### Issue: Process fails to start

**Check logs:**
```bash
./start-listener.sh logs
```

**Common errors:**
- `❌ Missing DISCORD_TOKEN` → Check that `.env` exists and is configured correctly
- `Error: Cannot find module 'discord.js'` → Run `npm install`

### Issue: No trigger after channel creation

**Possible causes:**
1. Channel is public (no permission overwrites)
2. Channel type is not a text channel (it's voice or a category)
3. Bot lacks Send Messages permission in the channel

**Solutions:**
- Ensure the channel is private (set permissions to allow only specific users/roles)
- Ensure the Bot has Send Messages permission in the channel

### Issue: Duplicate triggers

The listener uses `_seenChannels` to track already-processed channels and prevent duplicate triggers.

If you need to re-trigger during testing, you can:
1. Delete the `state.json` file
2. Or delete and recreate the channel

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `channel-listener.js` | Listener main process |
| `start-listener.sh` | Start/stop/management script |
| `.env` | Environment variable configuration |
| `channel-listener.pid` | Process ID file (auto-created) |
| `channel-listener.log` | Log file (auto-created) |
| `direct-handler.js` | Awakening logic handler (called by listener) |

---

## 🔁 Relationship with OpenClaw

**The listener is a standalone Discord bot process** — it does not depend on OpenClaw to run.

```
┌─────────────────────┐         ┌─────────────────────┐
│  Discord Gateway    │         │   OpenClaw Agent    │
│  (real-time events) │         │  (reactive messages)│
└──────────┬──────────┘         └──────────┬──────────┘
           │                                │
           ▼                                │
┌─────────────────────┐                     │
│  channel-listener   │                     │
│  (standalone Node)  │─────────────────────┘
│  listens → handler  │    triggered by user messages
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  direct-handler.js  │
│  (awakening logic)  │
└─────────────────────┘
```

**How they collaborate:**
- **Listener**: handles real-time Discord events (channel creation, member joins, etc.)
- **OpenClaw**: handles messages sent by users (@Bot start awakening, etc.)

Both can **run simultaneously** without conflict.

---

## 🎯 Testing

### Test 1: Create a private channel

1. Create a new channel on the Discord server
2. Set permissions: allow only specific users/roles (making the channel private)
3. Ensure the Bot has access to the channel
4. Check logs: you should see `[channel created]` and `[sent]`

### Test 2: Invite Bot to a new server

1. Generate an OAuth2 invite link from the Discord Developer Portal
2. Invite the Bot to a new test server
3. Check logs: you should see `[joined server]` and `[sent]`

---

## 📝 Notes

1. **Do not run multiple listener instances at the same time** — this will cause duplicate messages
2. **Check logs regularly** — ensure the process is running normally
3. **Token security** — do not commit the `.env` file to Git
4. **Process management** — use the `start-listener.sh` script; do not start with `node` directly

---

## 🆘 Need Help?

View full logs:
```bash
tail -f /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference/channel-listener.log
```

Check process status:
```bash
ps aux | grep channel-listener
```

Run manually in foreground:
```bash
cd /home/node/.openclaw/workspace/skills/travelclaw/skills/discord-awaken-claw/reference
node channel-listener.js
```
