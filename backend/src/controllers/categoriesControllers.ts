import { Request, Response } from 'express'
import { categoriesServices} from '../config/categoriesServices'

class categoriesControllers{

    static getCategories = async (req:Request, res:Response) => {
        try{
            const {userId} = req.params.userId
            const {categories} = await categoriesServices.getAllCategories(userId)
            if(categories)
            res.status(200).json(categories)
        }catch(err){
            console.error('Error en el controlador getCategories', err);
        }
    }

    static getCategory = async (req:Request, res:Response) => {
        try{
            const {category_id} = req.params.categoryId
            const {row} = await categoriesServices.getOneCategory(category_id)
            if(row)
            res.status(200).json(row)

        }catch(err){
            console.error('Error en el controlador getCategory', err)
        }
    }

}

export default categoriesControllers