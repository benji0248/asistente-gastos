import { db } from "../database/database";
import { newCategory } from "./types";

class categoriesServices{

    static getCategories = async (userId:string) => {
        try{
            const [result] = await db.query(`SELECT * FROM categories WHERE user_id = ?`, [userId])
            return result
        } catch (err){
            console.error('Error en el servicio getCategories', err)
        }
    }

    static getOneCategory = async (categoryId: string) => {
        try{
            const [result] = await db.query (`SELECT * FROM categories WHERE id = ?`, [categoryId])
            return result
        }catch (err){
            console.error('Error en el servicio getOneCategory')
        }
    }

    static createOneCategory = async (userId:string, categoryTitle: newCategory) => {
        try {
            const categoryCreated = await db.query (
                `INSERT INTO categories (user_id, name) VALUES (?,?)`, [userId, categoryTitle.name]
            );
        }catch(err){
            console.error('Error en el servicio createOneCategory', err)
        }
    }

    static updateOneCategory = async (categoryId: string, newTitle: string) => {
        try{
            await db.query(`
                UPDATE categories SET name = ? WHERE id = ?`, [newTitle, categoryId]
            );
        }catch (err){
            console.error('Error en el servicio updateOneCategory', err)
        }
    }
    
    static deleteOneCategory = async (categoryId: string) => {
        try{
            await db.query(`DELETE FROM categories WHERE id = ?`, [categoryId])
        }catch(err){
            console.error('Error en el servicio deleteOneCategory', err)
        }
    }
}

export default categoriesServices