import { db } from "../database/database";
import { Profile } from "./types";

class userServices {
    static getAllUsers = async () => {
        try {
            const [result] = await db.query("SELECT * FROM profiles")
            if (!result) {
                throw new Error('No se encontraron usuarios')
            }
            return result;
        } catch (err) {
            console.error('Error en el servicio getAllUsers:', err)
        }
    }

    static getUserById = async (userId: string) => {
        try {
            const [row] = await db.query(`SELECT * FROM profiles WHERE id = ?`, [userId])
            if (!row) {
                throw new Error('No se encontro el usuario')
            }
            return row as Profile[]
        } catch (err) {
            console.error('Error en el servicio getUserById', err)
        }
    }

    static updateOneUser = async (userId: string, updateData: Partial<Profile>) => {
        try {
            const [key, value] = Object.entries(updateData)[0]
            const query = `UPDATE profiles SET ${key} = ? WHERE id = ?`;
            await db.query(query, [value, userId])
        } catch (err) {
            console.error('Error en el servicio updateOneUser', err)
        }
    }

    static deleteOneUser = async (userId: string) => {
        try {
            await db.query(`DELETE FROM profiles WHERE id = ?`, [userId]);
        } catch (err) {
            console.error('Error en el servicio deleteOneUser', err)
        }
    }
}

export default userServices
