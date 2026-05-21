# AeroX AIO V3 — Discord Bot

## Overview

A feature-rich Discord bot built with Discord.js v14 featuring music playback, moderation, tickets, giveaways, and more. Uses hybrid sharding for scalability.

## Tech Stack

- **Runtime:** Node.js >= 18 (ES Modules)
- **Framework:** discord.js v14
- **Sharding:** discord-hybrid-sharding (ClusterManager)
- **Music:** lavalink-client (requires external Lavalink node)
- **Database:** better-sqlite3 (SQLite)
- **Other:** express, @napi-rs/canvas, discord-giveaways, axios, dotenv

## Project Structure

```
src/
  shard.js          # Entry point — spawns sharding clusters
  index.js          # Bot client initialization per shard
  commands/         # Slash commands (modular)
  events/           # Discord/music/node event handlers
  config/           # Config loaded from env vars
  database/         # SQLite repos + schema
  structures/       # Client classes and handlers
  managers/         # Music/Player/Queue managers
  utils/            # Helpers, logging, Spotify, image service
fonts/              # Font assets for canvas rendering
```

## Configuration

Copy `example.env` to `.env` and fill in required values:

- `DISCORD_TOKEN` — Your bot token (required)
- `CLIENT_ID` — Your bot's client/application ID (required)
- `OWNER_IDS` — Comma-separated Discord user IDs of bot owners (required)
- `LAVALINK_HOST/PORT/PASSWORD` — Lavalink server credentials (required for music)
- Spotify and Last.fm keys are optional

## Running

```bash
npm install
npm run start     # Production (node src/shard.js)
npm run dev       # Dev with auto-restart (node --watch src/shard.js)
```

## Commands — Full Slash + Prefix Coverage

All **121 commands** across moderation, Fun, and utility categories now have both prefix AND slash support (`enabledSlash: true`, `slashData`, and `slashExecute`).

### Admin (10 commands)
`autorole`, `welcome`, `goodbye`, `modlog`, `joinlog`, `boostmsg`, `massrole`, `selfrole`, `autopingsetup`, `autopublish`
Admin extras: `starboard`, `counting`, `setlog`, `reactrole`, `tempchannel`

### Moderation (41 commands)
`softban`, `timeout`, `untimeout`, `voicekick`, `voicemove`, `massban`, `slowmode`, `announce`, `giverole`, `removerole`, `deafen`, `undeafen`, `note`, `lockdown`, `warninfo`, `warnreset`, `muteinfo`, `mutereset`, `purgebots`, `remindinfo`, `remindreset`, `steal`, `stealsticker`, `unbanall`, `unhideall`, `unlockall`, `list`, and more

### Utility (37 commands)
`poll`, `timestamp`, `membercount`, `channelinfo`, `rolemembers`, `permissions`, `inviteinfo`, `firstmessage`, `serverroles`, `color`, `calculator`, `base64`, `binary`, `reverse`, `emojis`, `stickers`, `choose`, `password`, `uuid`, `charcount`, `urban`, `time`, `randomnum`, `boosts`, `uptime`, `botperms`, and more

### Fun (43 commands)
`8ball`, `coinflip`, `rps`, `roast`, `compliment`, `ship`, `wouldyourather`, `riddle`, `roll`, `joke`, `trivia`, `hug`, `pat`, `bonk`, `slap`, `poke`, `dadjoke`, `fact`, `quote`, `roulette`, `mock`, `iq`, `neverhaveiever`, `clap`, `highfive`, `cat`, `dog`, `bite`, `wave`, `feed`, `fortune`, `nitro`, `pickup`, `texttoemoji`, `howdumb`, `howgay`, `simprate`, `kill`, `lick`, `hack`, and more

### Event Handlers
- `guildMemberAdd` — autorole, welcome message, join log + invite tracking
- `guildMemberRemove` — goodbye message, leave log
- `guildMemberUpdate` — boost message when a member starts boosting
- `autopublishAutoping` (messageCreate) — auto-publish, auto-ping, **counting channel** (validate number sequence, reset on mistake)
- `starboard` (messageReactionAdd) — repost ⭐-reacted messages to a designated starboard channel

### Settings Database Tables
`src/database/repo/Settings.js` — SQLite (`settings.bread`) tables: `guild_settings`, `selfroles`, `autopings`, `autopublish_channels`, `user_notes`, `guild_logs`, `starboard`, `counting`.

## Deployment

- **Type:** VM (always-on — required for a persistent Discord bot)
- **Run command:** `node src/shard.js`
- Configure all required env vars as Replit Secrets before deploying
