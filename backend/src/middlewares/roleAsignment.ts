import roleServices from "../config/roleServices";
import { db } from "../database/database";

export const roleAsignment = async (userId: string, roleId: string) => {
    try {
        await db.query(`INSERT INTO users_roles (user_id, rol_id) VALUES (?, ?)`, [userId, roleId]);
    } catch (err) {
        console.error('Error en el middleware handleRoles', err);
    }
}

export const setEditor = async (userId: string, roleId: string) => {
    
    await db.query(`INSERT INTO users.roles (user_id, rol_id) VALUES (?,?)`, [userId, roleId]);

}