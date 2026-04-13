import express from "express";
import helmet from "helmet";
import session from "express-session";
import cors from "cors"

import bcrypt from "bcrypt";
const saltRounds = 10;

import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: 'localhost',
    password: 'Passw0rd',
    port: '3306',
    user: 'root',
    database: 'clone',
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
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret',
    cookie: {
        maxAge: 3600000,
    },
}));

app.get('/favicon.ico', (req, res) => res.status(204).send());

app.get("/", (req, res) => {
    res.send(req.session);
});

app.post("/register", async (req, res) => {
    if (!req.body) return res.status(400).json("Body required");
    const { name, pass } = req.body;
    if (!name || !pass) return res.status(400).json("Name and pass needed");

    const passwordHash = await hashPassword(pass);
    if (!passwordHash) return res.status(500).json("error");

    try {
        await pool.execute(
            'INSERT INTO `users` (username, password) VALUES (?, ?)',
            [name, passwordHash]
        );

        return res.json(`Account ${name} created`);
    } catch (err) {
        if (err.errno === 1062) return res.status(409).json("Username already exists");
        console.log(err)
        return res.status(500).json("error");
    }
})

app.post("/login", async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const { name, pass } = req.body;
    if (!name || !pass) return res.status(400).json("Name and pass needed");
    authenticate(name, pass, function (err, user) {
        if (err) return res.status(400).json(err);
        if (user) {
            req.session.regenerate(function () {
                console.log(user)
                req.session.user = user;

                req.session.save(function () {
                    res.json({ success: true, user });
                })
            })
        } else {
            res.status(401).json('Login or password is invalid.')
        }
    })
})

app.post("/server/register", requireAuth, async (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const userId = req.session.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json("Server name required");

    try {
        await pool.execute(
            'INSERT INTO `servers` (name, owner_id) VALUES (?, ?)',
            [name, userId]
        );

        return res.json(`Server ${name} created`)
    } catch (err) {
        if (err.errno === 1062) return res.status(409).json("Name already exists");
        console.log(err)
        return res.status(500).json("error")
    }
})

app.post("/channel/:serverId/register", requireAuth, async (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const userId = req.session.user.id;
    const { name } = req.body;
    const serverId = req.params.serverId;
    if (!name) return res.status(400).json("Channel name required");

    try {
        const [rows] = await pool.execute(
            'SELECT owner_id FROM `servers` WHERE `id` = ? LIMIT 1',
            [serverId]
        );

        console.log(rows)
        const owner = rows[0].owner_id;
        if (owner !== userId) return res.status(403).json("No permission to create channel")

        await pool.execute(
            'INSERT INTO `channels` (name, server_id) VALUES (?, ?)',
            [name, serverId]
        );

        return res.json(`Channel ${name} created`)
    } catch (err) {
        if (err.errno === 1062) return res.status(409).json("Name already exists");
        console.log(err)
        return res.status(500).json("error")
    }
})

app.post("/channel/:channelId/message", requireAuth, async (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const userId = req.session.user.id;
    const { message } = req.body;

    if (!message) return res.status(400).json("Message required");

    const channelId = req.params.channelId;

    try {
        await pool.execute(
            'INSERT INTO `messages` (content, user_id, channel_id) VALUES (?, ?, ?)',
            [message, userId, channelId]
        );

        return res.json(`Message Sent`)
    } catch (err) {
        console.log(err)
        return res.status(500).json("error")
    }
})

app.delete("/channel/:channelId/message/:messageId", requireAuth, async (req, res) => {
    const userId = req.session.user.id;

    const channelId = req.params.channelId;
    const messageId = req.params.messageId;

    try {
        await pool.execute(
            'DELETE FROM `messages` WHERE id = ? AND channel_ID = ? AND user_id = ?',
            [messageId, channelId, userId]
        );

        return res.json(`Message deleted`)
    } catch (err) {
        console.log(err)
        return res.status(500).json("error")
    }
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

async function hashPassword(password) {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch {
        return false;
    }
}

async function authenticate(name, pass, fn) {
    const [rows] = await pool.execute(
        'SELECT id, username, password FROM `users` WHERE `username` = ? LIMIT 1',
        [name]
    );
    if (!rows.length) return fn(null, null);

    var user = rows[0];

    bcrypt.compare(pass, user.password, function (err, ok) {
        if (err) return fn(err);
        if (!ok) return fn(null, null);
        return fn(null, { id: user.id, username: user.username });
    });
}

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    next();
}