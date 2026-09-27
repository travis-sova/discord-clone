# Discord Clone

A full-stack school project inspired by Discord, built with Vue 3, Express and MySQL.

## Features

- Username/password registration and login.
- Cookie-based sessions, CSRF protection and bcrypt password hashing.
- Debounced user search and one-to-one direct messages.
- Public servers and text channels accessible to signed-in users.
- Server creation; owners can create channels and rename their servers/channels.
- Sending, editing and deleting your own messages.
- Message grouping, date dividers and timestamps.
- Automatic message refresh approximately every three seconds.
- Loading older messages while preserving the scroll position.

## Stack

- **Frontend:** Vue 3, Vue Router, Vite, Tailwind CSS and DaisyUI.
- **Backend:** Node.js, Express, express-session, csrf-sync and mysql2.
- **Database:** MySQL 8.

## Requirements

- Node.js 22.12 or later in the Node.js 22 release line, with npm.
- MySQL 8 and MySQL Workbench.

Run the setup commands below in a terminal.

## Setup

### 1. Import the database

Start MySQL and run this query in MySQL Workbench:

```sql
CREATE DATABASE clone
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

Then:

1. Open **Server → Data Import**.
2. Select **Import from Self-Contained File**.
3. Choose `backend/dump/Dump.sql`.
4. Set **Default Target Schema** to `clone`.
5. Click **Start Import**.

Use a fresh database: the dump replaces existing project tables. It includes demo accounts and sample data.

### 2. Install dependencies and configure the backend

Open a terminal in the project root:

```sh
npm run setup
node -e "require('fs').copyFileSync('backend/.env.example', 'backend/.env')"
```

This installs dependencies for the root, backend and frontend.

Edit `backend/.env`:

- Set `DB_USER` and `DB_PASSWORD` to your MySQL credentials.
- Set `DB=clone`.
- Check that `DB_HOST` and `DB_PORT` match your MySQL installation.
- (OPTIONAL) Replace `SECRET` with a random string generated using:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the application

From the project root:

```sh
npm run dev
```

This starts the backend and frontend together:

- Frontend: open the local URL printed by Vite (normally http://localhost:5173).
- Backend: http://localhost:3000

Keep the terminal open. Press Ctrl+C to stop both services.

Use `localhost` consistently rather than switching to `127.0.0.1`.

### 4. Log in

The database dump includes these demo accounts:

| Username | Password |
|----------|----------|
| a1       | a        |
| a2       | a        |

You can also create additional accounts through registration.

For subsequent runs, make sure MySQL is running, then run `npm run dev` from the project root. Installation, database import and environment configuration are only needed during initial setup.

## Try the application

1. Log in as `a1`.
2. Open a private browser window and log in as `a2`.
3. Use **Find or start a conversation** to search for the other username.
4. Open a DM and send a message. Reload the recipient’s page if the conversation is not yet listed.
5. Try editing and deleting your own messages.
6. Use the **+** button in the server sidebar to create a server.
7. As its owner, create a channel and try renaming the server/channel.
8. Use the other account to view public channels. Owner actions and editing another user’s messages should be unavailable.

## Project structure

```text
backend/
  index.js         API routes, session setup and access checks
  dm.js            Transactional direct-message creation
  validation.js    Input validation helpers
  .env.example     Example environment configuration
  dump/
    Dump.sql       Complete database dump
    sharded/
      clone_users.sql             Users
      clone_servers.sql           Servers and ownership
      clone_channels.sql          Server channels
      clone_messages.sql          Server messages
      clone_dm_channels.sql       Direct-message conversations
      clone_dm_participants.sql   DM conversation participants
      clone_dm_messages.sql       Direct messages
frontend/
  public/          Images, fonts and other static assets
  src/
    components/    Chat UI, navigation and dialogs
    services/      API requests and shared authentication state
    views/         Pages
```

## Database structure

The MySQL database is relational and consists of the following main tables:

- `users` — registered users.
- `servers` — Discord-style servers, owned by users.
- `channels` — text channels belonging to servers.
- `messages` — messages sent by users in server channels.
- `dm_channels` — direct-message conversations.
- `dm_participants` — joins users to DM conversations.
- `dm_messages` — messages belonging to DM conversations.

The individual table definitions, including primary keys and foreign-key
relationships, are available in [`backend/dump/sharded`](backend/dump/sharded/).

[`backend/dump/Dump.sql`](backend/dump/Dump.sql) contains the complete database for importing into MySQL.

Important foreign-key relationships include:

- `servers.owner_id` → `users.id` — each server is owned by a user.
- `channels.server_id` → `servers.id` — each channel belongs to a server.
- `messages.channel_id` → `channels.id` — each server message belongs to a channel.
- `messages.user_id` → `users.id` — each server message is sent by a user.
- `dm_participants.channel_id` → `dm_channels.id` — associates participants with a DM conversation.
- `dm_participants.user_id` → `users.id` — associates users with the DM conversations they participate in.
- `dm_messages.channel_id` → `dm_channels.id` — each direct message belongs to a DM conversation.
- `dm_messages.user_id` → `users.id` — each direct message is sent by a user.

`backend/dump/Dump.sql` contains the complete database for importing into MySQL.
The individual [`clone_*.sql`](backend/dump/sharded/) files contain the schema
and sample data for each table separately.

## Current scope and limitations

- Servers are public to all signed-in users; there is no membership or invitation system.
- Messages use polling rather than WebSockets.
- Older-message loading expands the fetched window; each poll refreshes that window.
- Server, channel and DM lists do not automatically synchronize changes from other clients. Reload when necessary.
- Avatars are placeholders. Voice/video, attachments, reactions, friend management, password recovery and account settings are not implemented.
- Some Discord-inspired controls are visual placeholders.
- The backend has a logout endpoint, but there is currently no logout control in the interface.
- Registration stores only the username and password hash. Other profile fields shown in the form are not saved.
- Sessions are stored in memory and are lost when the backend restarts.

## Credits

The visual design is inspired by Discord. Discord names, artwork and bundled fonts are third-party materials; this project does not claim ownership of them.