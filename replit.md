# Memberk Emails — Discord Bot

A Discord bot that generates disposable email aliases on custom domains and delivers incoming emails to users via Discord DM.

## Run & Operate

- **Start bot**: `pnpm --filter @workspace/discord-bot run start`
- **Register commands**: `pnpm --filter @workspace/discord-bot run deploy-commands`
  - Run once after setup, and again whenever you change `DOMAIN_COMMANDS`
  - Set `GUILD_1` in Secrets for instant registration during development

## Required Secrets

| Key | Description |
|---|---|
| `TOKEN_1` | Bot token — discord.com/developers → your app → Bot → Reset Token |
| `CLIENT_1` | Client ID — discord.com/developers → your app → General Information |
| `GUILD_1` | (Optional) Your test server ID for instant command registration |
| `DOMAIN_COMMANDS` | e.g. `lgen:larpers.cc,ngen:nachtmail.online` |

Add `TOKEN_2` + `CLIENT_2` (and so on) to run multiple bots in parallel sharing the same database and commands.

## Commands

| Command | Description |
|---|---|
| `/gen` | Generate address on a random domain |
| `/lgen`, `/ngen`, ... | Generate on a specific domain (configured via `DOMAIN_COMMANDS`) |
| `/listmails` | List all your active addresses (private/ephemeral) |
| `/ping` | Bot latency |
| `/usage` | Show all commands |

## Stack

- Node.js 22, ES Modules, discord.js v14
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
- `node:sqlite` (Node.js 22 built-in) avoids native compilation issues on Replit
- Soft deletes preserve alias history; ownership checks prevent cross-user access
- Webhook server is opt-in (`ENABLE_WEBHOOK_SERVER=true`) — most users start with `/gen` first

## Gotchas

- **Re-run `deploy-commands` every time you change `DOMAIN_COMMANDS`** — otherwise Discord won't show the new commands
- Set `GUILD_1` during dev for instant command updates; remove it for global deployment
- The `data/` directory is created automatically — no manual setup needed
- Users need DMs enabled in their Discord settings to receive email deliveries
