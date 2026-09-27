import { HttpError, positiveId, textInput, passwordInput } from "./validation.js";
import { openDirectMessage } from "./dm.js";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import cors from "cors";
import { csrfSync } from "csrf-sync";

import bcrypt from "bcrypt";
const saltRounds = 10;

import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const app = express();

app.use(express.json());

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
            upgradeInsecureRequests: null,
        },
    },
}));

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 3600000,
    },
}));

const {
    csrfSynchronisedProtection,
    generateToken,
} = csrfSync();

app.get("/csrf-token", (req, res) => {
    res.set("Cache-Control", "no-store");
    const forceNew = req.query.refresh === "true";

    res.json({
        csrfToken: generateToken(req, forceNew),
    });
});

app.use(csrfSynchronisedProtection);

for (const parameter of ['id', 'serverId', 'channelId', 'messageId']) {
    app.param(parameter, (req, res, next, value) => {
        req.params[parameter] = positiveId(value, parameter);
        next();
    });
}

app.get('/favicon.ico', (req, res) => res.status(204).send());

app.get("/me", requireAuth, async (req, res) => {
    res.set("Cache-Control", "no-store");
    return res.status(200).json({
        success: true,
        user: req.session.user,
        redirectTo: '/channels/@me',
    });
});

app.post("/logout", async (req, res) => {
    await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    res.clearCookie("connect.sid");
    res.json({ success: true, redirectTo: "/login" });
});

app.post("/register", async (req, res) => {
    const name = textInput(req.body?.name, 'Username', 50);
    const pass = passwordInput(req.body?.pass, true);
    const passwordHash = await bcrypt.hash(pass, saltRounds);
    await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [name, passwordHash]);
    res.status(201).json({ success: true });
});

app.post("/login", async (req, res) => {
    const name = textInput(req.body?.name, 'Username', 50);
    const pass = passwordInput(req.body?.pass);
    const [rows] = await pool.execute('SELECT id, username, password FROM users WHERE username = ? LIMIT 1', [name]);
    const row = rows[0];
    if (!row || !await bcrypt.compare(pass, row.password)) {
        throw new HttpError(401, 'Login or password is invalid.', 'INVALID_CREDENTIALS');
    }
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    const user = { id: row.id, username: row.username };
    req.session.user = user;
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ success: true, user, redirectTo: '/channels/@me' });
});

app.get("/dm", requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const [dms] = await pool.execute(
        `SELECT
                p.channel_id,
                u.id AS other_user_id,
                u.username AS other_username
            FROM dm_participants p
            INNER JOIN dm_participants p2
                ON p.channel_id = p2.channel_id
            INNER JOIN users u
                ON u.id = p2.user_id
            WHERE p.user_id = ?
                AND p2.user_id <> ?`,
        [userId, userId]
    );

    return res.status(200).json(dms)
})

app.post("/dm/open", requireAuth, async (req, res) => {
    const targetId = positiveId(req.body?.targetId, 'targetId');
    const result = await openDirectMessage(pool, Number(req.session.user.id), targetId);
    res.status(result.created ? 201 : 200).json(result);
});

app.get("/dm/:channelId/messages", requireAuth, requireDmMember, async (req, res) => {
    const channelId = req.params.channelId;
    const limit = positiveId(req.query.limit ?? 50, 'limit');

    const [rows] = await pool.execute(
        `SELECT content, id, user_id, created_at
         FROM dm_messages
         WHERE channel_id = ?
         ORDER BY id DESC
         LIMIT ?`,
        [channelId, limit + 1]
    );

    res.json({
        messages: rows.slice(0, limit).reverse(),
        hasMore: rows.length > limit
    });
})

app.post("/dm/:channelId/message", requireAuth, requireDmMember, async (req, res) => {
    const message = textInput(req.body?.message, 'Message', 2000);
    const channelId = req.params.channelId;
    const userId = req.session.user.id;
    const [messages] = await pool.execute(
        'INSERT INTO `dm_messages` (channel_id, user_id, content) VALUES (?, ?, ?)',
        [channelId, userId, message]
    );

    return res.status(201).json({ success: true, messageId: messages.insertId })
})

app.delete("/dm/:channelId/message/:messageId", requireAuth, requireDmMember, async (req, res) => {
    const channelId = req.params.channelId;
    const messageId = req.params.messageId;

    const userId = req.session.user.id;
    const [messages] = await pool.execute(
        'DELETE FROM `dm_messages` WHERE `channel_id` = ? AND `id` = ? AND `user_id` = ?',
        [channelId, messageId, userId]
    );

    if (!messages.affectedRows) throw new HttpError(404, "Message not found", "NOT_FOUND");
    return res.json({ success: true })
})

app.patch("/dm/:channelId/message/:messageId", requireAuth, requireDmMember, async (req, res) => {
    const channelId = req.params.channelId;
    const messageId = req.params.messageId;
    const userId = req.session.user.id;
    const message = textInput(req.body?.message, 'Message', 2000);

    const [result] = await pool.execute(
        `UPDATE dm_messages
        SET content = ?
        WHERE channel_id = ? AND id = ? AND user_id = ?`,
        [message, channelId, messageId, userId]
    );

    if (!result.affectedRows) throw new HttpError(404, "Message not found", "NOT_FOUND");

    return res.json({ success: true })
})

app.get("/server", requireAuth, async (req, res) => {
    const [servers] = await pool.execute(
        'SELECT id, name, owner_id FROM `servers`'
    );

    return res.status(200).json(servers)
})

app.get("/server/:id/channels", requireAuth, async (req, res) => {
    const channelId = req.params.id;

    const [channels] = await pool.execute(
        'SELECT id, name FROM `channels` WHERE `server_id` = ?',
        [channelId]
    );

    return res.status(200).json(channels)
})

app.post("/server/register", requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const name = textInput(req.body?.name, 'Server name', 100);

    const [result] = await pool.execute(
        'INSERT INTO servers (name, owner_id) VALUES (?, ?)',
        [name, userId]
    );

    res.status(201).json({
        success: true,
        server: {
            id: result.insertId,
            name,
            owner_id: userId
        }
    });
});

app.post("/channel/:serverId/register", requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const name = textInput(req.body?.name, 'Channel name', 100);
    const serverId = req.params.serverId;

    const [rows] = await pool.execute(
        'SELECT owner_id FROM `servers` WHERE `id` = ? LIMIT 1',
        [serverId]
    );

    if (!rows.length) throw new HttpError(404, "Server not found", "NOT_FOUND");
    const owner = Number(rows[0].owner_id);
    if (owner !== Number(userId)) throw new HttpError(403, "No permission to create channel", "FORBIDDEN");

    const [result] = await pool.execute(
        'INSERT INTO channels (name, server_id) VALUES (?, ?)',
        [name, serverId]
    );

    res.status(201).json({
        success: true,
        channel: {
            id: result.insertId,
            name,
            server_id: serverId
        }
    });
})

app.post("/channel/:channelId/message", requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const message = textInput(req.body?.message, 'Message', 2000);

    const channelId = req.params.channelId;

    await pool.execute(
        'INSERT INTO `messages` (content, user_id, channel_id) VALUES (?, ?, ?)',
        [message, userId, channelId]
    );

    return res.status(201).json({ success: true, message: "Message sent" })
})

app.delete("/channel/:channelId/message/:messageId", requireAuth, async (req, res) => {
    const userId = req.session.user.id;

    const channelId = req.params.channelId;
    const messageId = req.params.messageId;

    const [result] = await pool.execute(
        'DELETE FROM `messages` WHERE id = ? AND channel_ID = ? AND user_id = ?',
        [messageId, channelId, userId]
    );

    if (!result.affectedRows) throw new HttpError(404, "Message not found", "NOT_FOUND");
    return res.json({ success: true, message: "Message deleted" })

})

app.get("/channel/:channelId/messages", requireAuth, async (req, res) => {
    const channelId = req.params.channelId;
    const limit = positiveId(req.query.limit ?? 50, 'limit');

    const [channels] = await pool.execute(
        'SELECT id FROM channels WHERE id = ?',
        [channelId]
    );

    if (!channels.length) {
        throw new HttpError(404, 'Channel not found', 'NOT_FOUND');
    }

    const [rows] = await pool.execute(
        `SELECT m.id, m.content, m.user_id, m.created_at, u.username
         FROM messages m
         JOIN users u ON u.id = m.user_id
         WHERE m.channel_id = ?
         ORDER BY m.id DESC
         LIMIT ?`,
        [channelId, limit + 1]
    );

    res.json({
        messages: rows.slice(0, limit).reverse(),
        hasMore: rows.length > limit
    });
});

app.patch("/channel/:channelId/message/:messageId", requireAuth, async (req, res) => {
    const message = textInput(req.body?.message, 'Message', 2000);

    const [result] = await pool.execute(
        `UPDATE messages
         SET content = ?
         WHERE channel_id = ? AND id = ? AND user_id = ?`,
        [
            message,
            req.params.channelId,
            req.params.messageId,
            req.session.user.id
        ]
    );

    if (!result.affectedRows) {
        throw new HttpError(404, 'Message not found', 'NOT_FOUND');
    }

    res.json({ success: true });
});

app.patch("/server/:serverId", requireAuth, async (req, res) => {
    const name = textInput(req.body?.name, 'Server name', 100);

    const [result] = await pool.execute(
        'UPDATE servers SET name = ? WHERE id = ? AND owner_id = ?',
        [name, req.params.serverId, req.session.user.id]
    );

    if (!result.affectedRows) {
        throw new HttpError(
            404, 'Server not found or you are not its owner', 'NOT_FOUND'
        );
    }

    res.json({ success: true, name });
});

app.patch("/channel/:channelId", requireAuth, async (req, res) => {
    const name = textInput(req.body?.name, 'Channel name', 100);

    const [result] = await pool.execute(
        `UPDATE channels c
         JOIN servers s ON s.id = c.server_id
         SET c.name = ?
         WHERE c.id = ? AND s.owner_id = ?`,
        [name, req.params.channelId, req.session.user.id]
    );

    if (!result.affectedRows) {
        throw new HttpError(
            404, 'Channel not found or you are not the server owner', 'NOT_FOUND'
        );
    }

    res.json({ success: true, name });
});

app.get("/users/search", requireAuth, async (req, res) => {
    const query = textInput(req.query.q, 'Search', 50, 2);

    const [users] = await pool.execute(
        `SELECT id, username
         FROM users
         WHERE id <> ? AND LOCATE(?, username) > 0
         ORDER BY username, id
         LIMIT 20`,
        [req.session.user.id, query]
    );

    res.json(users);
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' }));
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500;
    let message = error instanceof HttpError ? error.message : 'The server could not complete the request.';
    let code = error.code || 'INTERNAL_ERROR';
    if (error.code === 'EBADCSRFTOKEN') { status = 403; message = 'Session security token expired. Please try again.'; }
    else if (error.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; code = 'INVALID_JSON'; }
    else if (error.type === 'entity.too.large') { status = 413; message = 'Request body is too large'; code = 'BODY_TOO_LARGE'; }
    else if (error.errno === 1062) { status = 409; message = 'That name is already in use'; code = 'CONFLICT'; }
    else if (error.errno === 1452) { status = 404; message = 'Referenced record not found'; code = 'NOT_FOUND'; }
    else if (status >= 500) { console.error('Request failed:', error); code = 'INTERNAL_ERROR'; }
    res.status(status).json({ success: false, error: message, code });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, error: "Not authenticated", code: "UNAUTHENTICATED", redirectTo: '/login' });
    }
    next();
}

async function requireDmMember(req, res, next) {
    const [membership] = await pool.execute(
        `SELECT 1 FROM dm_participants
         WHERE channel_id = ? AND user_id = ?
         LIMIT 1`,
        [req.params.channelId, req.session.user.id]
    );

    if (!membership.length) {
        throw new HttpError(
            403,
            'No access to this conversation',
            'FORBIDDEN'
        );
    }

    next();
}