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
            const {categoryId} = req.params.categoryId
            const {row} = await categoriesServices.getOneCategory(category_id)
            if(row)
            res.status(200).json(row)

        }catch(err){
            console.error('Error en el controlador getCategory', err)
        }
    }

    static addCategory = async (req: Request, res:Response) => {
        try{
            const {userId} = req.params.user_id
            const createdCategory = await categoriesServices.createOneCategory(user_id, req.body)
            res.status(201).json(createdCategory)
        }catch(err){
            console.error('Error en el controlador addCategory')
        }
    }

    static updateCategory = async (req: Request, res:Response) => {
        try{
            const {categoryId} = req.params.category_id
            const updatedCategory = await categoriesServices.updateOneCategory(category_id, req.body)
            res.status(201).json(updatedCategory)
        }catch(err){
            console.error('Error en el controlador updateCategory')
        }
    }

    static deleteCategory = async (req:Request, res:Response) => {
        try{
            const {categoryId} = req.params.category_id
            await categoriesServices.deleteOneCategory(category_id)
            res.status(200)
        }catch(err){
            console.error('Error en el controlador deleteCategory')
        }
    }
}

export default categoriesControllers