/**
 * Travelclaw - Discord Channel Event Listener (Full Version)
 *
 * Listens for channel creation, button clicks, and message events
 * Calls LLM API directly for follow-up questions / guessing
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const handler = require('./direct-handler.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || 'https://litellm.talesofai.cn/v1';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const MODEL = process.env.LLM_MODEL || 'litellm/qwen3.5-plus';

if (!TOKEN) {
  console.error('❌ Missing DISCORD_TOKEN');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Listener started: ${c.user.tag}`);
  console.log(`   Listening on server: ${GUILD_ID || 'all servers'}`);
  console.log('\n💡 Listening: channel creation (only for sending initial guide message)');
  console.log('💡 Message and button interactions are handled by the OpenClaw main agent');
});

// ─── LLM Call ──────────────────────────────────────────────────────────
async function callLLM(prompt, systemPrompt) {
  if (!LITELLM_API_KEY) {
    throw new Error('Missing LITELLM_API_KEY environment variable');
  }

  const response = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─── Message Send Adapter ───────────────────────────────────────────────
function createSendMessage(channel) {
  return async (payload) => {
    try {
      const discordPayload = {
        content: payload.message || '',
      };

      if (payload.components?.blocks) {
        const actionRows = payload.components.blocks.map(block => {
          if (block.type === 'actions' && block.buttons) {
            const buttons = block.buttons.map(btn => {
              return new ButtonBuilder()
                .setLabel(btn.label)
                .setCustomId(btn.customId)
                .setStyle(btn.style === 'primary' ? ButtonStyle.Primary :
                         btn.style === 'success' ? ButtonStyle.Success :
                         btn.style === 'danger' ? ButtonStyle.Danger :
                         ButtonStyle.Secondary);
            });
            return new ActionRowBuilder().addComponents(buttons);
          }
          return null;
        }).filter(r => r !== null);

        if (actionRows.length > 0) {
          discordPayload.components = actionRows;
        }
      }

      const msg = await channel.send(discordPayload);
      console.log('[sent successfully]', (payload.message || '[components]').substring(0, 50));
      return msg;
    } catch (error) {
      console.error('[send failed]', error.message);
      throw error;
    }
  };
}

// ─── Auto-trigger on Channel Creation ─────────────────────────────────────
client.on(Events.ChannelCreate, async (channel) => {
  if (channel.type !== 0 && channel.type !== 5) return;

  const isPrivate = channel.permissionOverwrites.cache.size > 0;
  if (!isPrivate) {
    console.log('[skipped] public channel:', channel.id);
    return;
  }

  // 🔴 Check if this channel has already been processed (prevent duplicate sends from multiple listener instances)
  if (handler.hasSeenChannel(channel.id)) {
    console.log('[skipped] already-processed channel:', channel.id);
    return;
  }

  console.log('[channel created]', channel.id, channel.name || 'unnamed');

  await sleep(2000);

  try {
    const botMember = await channel.guild.members.fetch(client.user.id);
    const botPermissions = channel.permissionsFor(botMember);

    if (!botPermissions.has('ViewChannel') || !botPermissions.has('SendMessages')) {
      console.log('[skipped] Bot lacks permission:', channel.id);
      return;
    }
  } catch (err) {
    console.log('[permission check] ❌', err.message);
    return;
  }

  const sendMessage = createSendMessage(channel);

  await handler.handleChannelCreate({
    id: channel.id,
    type: channel.type,
    permission_overwrites: [...channel.permissionOverwrites.cache.values()],
  }, sendMessage);
});

// 🔴 Button interaction and regular message listeners removed - handled by the OpenClaw main agent
// Only channel creation auto-trigger is kept

client.login(TOKEN);
