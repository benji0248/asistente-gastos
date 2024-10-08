import { db } from "../database/database";
import { Users, newUsers } from "./types";

class userServices{
    static getAllUsers = async () => {
        try {
            const [result] = await db.query("SELECT * FROM users")
            if (!result) {
                throw new Error('No se encontraron usuarios')
            }
            return result;
        } catch (err) {
            console.error('Error en el servicio getAllUsers:', err)
        }
    }
    
    static getUserById = async (userId:string) => {
        try {
            const [row] = await db.query(`
                SELECT * FROM users WHERE id = ?`, [userId])
            if (!row) {
                throw new Error('No se encontro el usuario')
            }
            return row as Users[]
        } catch (err) {
            console.error('Error en el servicio getUserById', err)
        }
    }

    static getUserId = async (username: string) => {
        try {
            const [user] = await db.query(`SELECT * FROM users WHERE username = ?`, username)
            const [typedUser] = user as Users[]
            return typedUser.id
        } catch (err) {
            console.error('Error en el servicio getUserId', err);
        }
    }
    
    static createOneUser = async (dataUser:newUsers) => {
        try {
            await db.query(`
            INSERT INTO users (username, email, pwd, created_at) VALUES(?,?,?, now())`, [dataUser.username, dataUser.email, dataUser.pwd])
        } catch (err) {
            console.error('Error en el servicio createOneUser', err)
        }
    }
    
    static updateOneUser = async (userId:string, updateData:keyof Users) => {
        try {
            const [key, value] = Object.entries(updateData)[0]
            const query = `
                UPDATE users
                SET ${key} = ?
                WHERE id = ?`;
            await db.query(query, [value, userId])
        } catch (err) {
            console.error('Error en el servicio updateOneUser', err)
        }
    }
    
    static deleteOneUser = async (userId:string) => {
        try {
            await db.query(`DELETE FROM users WHERE id = ?`, [userId]);
        } catch (err) {
            console.error('Error en el servicio deleteOneUser', err)
        }
    }
}
export default userServices