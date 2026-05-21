# Memberk Emails — Discord Bot

A Discord bot that generates disposable email aliases on custom domains and delivers incoming emails to users via Discord DM.

## Run & Operate

- **Start bot**: `pnpm --filter @workspace/discord-bot run start`
- **Register commands**: `pnpm --filter @workspace/discord-bot run deploy-commands`
  - Run once after setup, and again whenever you change `DOMAIN_COMMANDS`
  - Set `DISCORD_GUILD_ID` in Secrets for instant registration during development

## Required Secrets (add in Replit Secrets panel)

| Key | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | From discord.com/developers → your app → Bot → Reset Token |
| `DISCORD_CLIENT_ID` | From discord.com/developers → your app → General Information |
| `DISCORD_GUILD_ID` | Your test server ID (for instant command registration) |
| `DOMAIN_COMMANDS` | e.g. `lgen:larpers.cc,ngen:nachtmail.online` |

## Commands

| Command | Description |
|---|---|
| `/gen` | Generate address on a random domain |
| `/lgen`, `/ngen`, ... | Generate on a specific domain (configured via `DOMAIN_COMMANDS`) |
| `/listmails` | List all your active addresses (private/ephemeral) |
| `/ping` | Bot latency |
| `/usage` | Show all commands |

## Stack

- Node.js 24, ES Modules, discord.js v14
- SQLite via `node:sqlite` (Node.js built-in — no native compilation)
- Express + multer for email webhook delivery server
- No external database required

## Where things live

```
artifacts/discord-bot/
  src/
    index.js                  — startup: loads commands, events, DB, webhook server
    deploy-commands.js        — one-time slash command registration script
    commands/
      gen.js                  — /gen (random domain)
      listmails.js            — /listmails
      ping.js                 — /ping
      usage.js                — /usage (help embed)
    events/
      ready.js                — fires on login
      interactionCreate.js    — command dispatcher
    utils/
      database.js             — SQLite CRUD layer
      domains.js              — parses DOMAIN_COMMANDS env var
      aliasGenerator.js       — shared alias creation logic (cooldowns, cap, dedup)
      cooldowns.js            — in-memory per-user rate limiter
      logger.js               — timestamped logger with alias audit trail
    server.js                 — Express webhook server for email-to-DM delivery
  data/aliases.db             — SQLite database (auto-created, gitignored)
  .env.example                — all env var documentation
  SETUP.md                    — full setup guide
```

## Architecture decisions

- Domain-specific commands (`/lgen`, `/ngen`, etc.) are created dynamically in memory from the `DOMAIN_COMMANDS` env var — no separate files needed per domain
- `node:sqlite` (Node.js 24 built-in) avoids native compilation issues on Replit
- Soft deletes preserve alias history; ownership checks prevent cross-user access
- Webhook server is opt-in (`ENABLE_WEBHOOK_SERVER=true`) — most users start with `/gen` first

## Gotchas

- **Re-run `deploy-commands` every time you change `DOMAIN_COMMANDS`** — otherwise Discord won't show the new commands
- Set `DISCORD_GUILD_ID` during dev for instant command updates; remove it for global deployment
- The `data/` directory is created automatically — no manual setup needed
- Users need DMs enabled in their Discord settings to receive email deliveries
