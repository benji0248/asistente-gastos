import { db } from "../database/database";
import { Role, Users } from "./types";

class roleServices {

    static getRole = async (userId: string) => {
        const [result] = await db.query(`SELECT * FROM users WHERE id = ?`, userId);
        const [typedResult] = result as Users[]
        return typedResult.roles;
    }

}

export default roleServices