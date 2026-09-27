import { HttpError } from './validation.js';

export async function openDirectMessage(pool, userId, targetId) {
    if (userId === targetId) throw new HttpError(400, 'You cannot message yourself');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Every pair creation locks the same existing user rows in the same order.
        // This serializes concurrent A→B and B→A requests before their first lookup.
        for (const id of [userId, targetId].sort((a, b) => a - b)) {
            const [rows] = await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [id]);
            if (!rows.length) throw new HttpError(404, 'User not found', 'NOT_FOUND');
        }
        const [existing] = await connection.execute(
            `SELECT p1.channel_id
             FROM dm_participants p1
             JOIN dm_participants p2 ON p1.channel_id = p2.channel_id
             JOIN dm_channels c ON c.id = p1.channel_id
             WHERE p1.user_id = ? AND p2.user_id = ? AND c.is_group = 0
               AND (SELECT COUNT(*) FROM dm_participants p3 WHERE p3.channel_id = p1.channel_id) = 2
             ORDER BY p1.channel_id LIMIT 1`,
            [userId, targetId]
        );
        let channelId = existing[0]?.channel_id;
        if (!channelId) {
            const [result] = await connection.execute(
                'INSERT INTO dm_channels (created_by, is_group) VALUES (?, 0)', [userId]
            );
            channelId = result.insertId;
            await connection.execute(
                'INSERT INTO dm_participants (channel_id, user_id) VALUES (?, ?), (?, ?)',
                [channelId, userId, channelId, targetId]
            );
        }
        await connection.commit();
        return { success: true, created: existing.length === 0, channelId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
