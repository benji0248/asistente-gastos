import { db } from "../database/database";

export const handleTokenInsertion = async (token: string, userId: string) => {
    if (!token || !userId) throw new Error('Falta de token o de id para el middleware')
    try {
        await db.query(`INSERT INTO tokens (user_id, token, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,[userId, token])
    } catch (err) {
        console.error('Error en el middleware handleTokenInsertion', err)
    }
}