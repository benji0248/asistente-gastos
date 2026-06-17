import { db } from "../database/database";

export const handleDuplicate = async (field: Object) => {
    
    const [key] = Object.keys(field)
    const value = Object.values(field)
    const [rows] = await db.query<{ count: string }[]>(`SELECT COUNT(*) AS count FROM users WHERE ${key} = ?`, value)
    const result = Number(rows[0]?.count ?? 0)
    
    if (result > 0) {
        return true;
    } else {
        return false;
    }
}