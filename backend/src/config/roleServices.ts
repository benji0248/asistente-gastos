import { db } from "../database/database";
import { Profile } from "./types";

class roleServices {

    static getRole = async (userId: string) => {
        const [result] = await db.query(`SELECT * FROM profiles WHERE id = ?`, userId);
        const [typedResult] = result as Profile[]
        return typedResult.role;
    }

}

export default roleServices