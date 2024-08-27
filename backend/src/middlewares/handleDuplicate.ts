import { db } from "../database/database";

export const handleDuplicate = async (field: Object) => {
    
    const [key] = Object.keys(field)
    const value = Object.values(field)
    const duplicateValue: any = await db.query(`SELECT COUNT (*) FROM users WHERE ${key} = ?`, value)
    const result = duplicateValue[0][0]['COUNT (*)'];
    
    if (result > 0) {
        return true;
    } else {
        return false;
    }
}