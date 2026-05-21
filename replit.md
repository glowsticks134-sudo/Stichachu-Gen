# Discord Email Alias Bot

A Discord bot that lets users generate, manage, and delete disposable email aliases on a custom domain via slash commands.

## Run & Operate

- `pnpm --filter @workspace/discord-bot run start` — start the Discord bot
- `pnpm --filter @workspace/discord-bot run deploy-commands` — register slash commands with Discord (run once after setup, or after adding commands)
- Required env: see `.env.example` in `artifacts/discord-bot/`

## Stack

- pnpm workspaces, Node.js 24, ES Modules
- Discord: discord.js v14, slash commands, ephemeral embeds
- DB: Node.js built-in `node:sqlite` (no native compilation needed)
- HTTP: axios (for SimpleLogin / Cloudflare API calls)
- Provider support: SimpleLogin API, Cloudflare Email Routing, or Local (catch-all)

## Where things live

```
artifacts/discord-bot/
  src/
    index.js              — entry point, loads commands + events
    deploy-commands.js    — one-time slash command registration
    commands/
      createemail.js      — /createemail
      myemails.js         — /myemails
      deleteemail.js      — /deleteemail
      emailinfo.js        — /emailinfo
    events/
      ready.js            — fires once on login
      interactionCreate.js — command dispatcher
    utils/
      database.js         — SQLite layer (node:sqlite)
      emailService.js     — provider abstraction (SimpleLogin / Cloudflare / local)
      cooldowns.js        — in-memory per-user cooldown tracker
      logger.js           — timestamped console logger with alias audit trail
  data/aliases.db         — SQLite database (gitignored, created at runtime)
  .env.example            — all required environment variable names with docs
  SETUP.md                — full setup guide (domain DNS, Discord app, providers)
```

## Architecture decisions

- `node:sqlite` (Node.js 24 built-in) replaces `better-sqlite3` to avoid native compilation in the Replit environment
- Soft deletes in the DB (`status = 'deleted'`) preserve an audit trail of all aliases ever created
- Aliases are stored and enforced at the DB level — provider API is called only on create/delete
- Cooldowns are in-memory (Map) so they reset on restart; use the DB if persistence across restarts is needed
- All command replies are ephemeral — alias emails never appear in public channels

## Product

Users can:
1. `/createemail` — generate a random alias like `swiftfox4721@yourdomain.com` (30s cooldown, max 5 aliases per user)
2. `/myemails` — see all their active aliases in a private (ephemeral) reply
3. `/deleteemail alias:<email>` — remove an alias; deletes it from both the provider and the database
4. `/emailinfo alias:<email>` — view creation date, status, and provider info for any alias they own

## User preferences

- Use `node:sqlite` for SQLite — no native builds required in Replit

## Gotchas

- **Always run `deploy-commands` after adding or changing command definitions** — stale command schemas cause Discord to show old options
- Set `DISCORD_GUILD_ID` in Secrets during development for instant command registration (global registration takes up to 1 hour)
- The `data/` directory is created automatically at startup — no need to create it manually
- SimpleLogin requires the custom domain to be verified in your account before creating aliases

## Pointers

- Full setup guide (DNS, Discord app creation, provider configuration): `artifacts/discord-bot/SETUP.md`
- Environment variable reference: `artifacts/discord-bot/.env.example`
