import { db } from "../database/database";
import { Role } from "./types";

class roleServices {

    static getRoleId = async (role: string) => {
        const [result] = await db.query(`SELECT * FROM roles WHERE rol = ?`, role);
        const [typedResult] = result as Role[]
        return typedResult.id
    }

    static defaultRoleId = async () => {
        const role = 'user'
        const [result] = await db.query(`SELECT * FROM roles WHERE rol = ?`, role);
        const [typedResult] = result as Role[]
        return typedResult.id
    }
    

}

export default roleServices