import { Request, Response } from 'express'
import categoriesServices from '../config/categoriesServices'

class categoriesControllers{

    static getAllCategories = async (req:Request, res:Response) => {
        try{
            const userId = req.params.userId
            const categories = await categoriesServices.getCategories(userId)
            if(categories)
            res.status(200).json(categories)
        }catch(err){
            console.error('Error en el controlador getCategories', err);
        }
    }

    static getCategory = async (req:Request, res:Response) => {
        try{
            const categoryId = req.params.categoryId
            const row = await categoriesServices.getOneCategory(categoryId)
            if(row)
            res.status(200).json(row)

        }catch(err){
            console.error('Error en el controlador getCategory', err)
        }
    }

    static addCategory = async (req: Request, res:Response) => {
        try {
            const userId = req.params.userId
            if (userId) {
                const createdCategory = await categoriesServices.createOneCategory(userId, req.body)
                res.status(201).json(createdCategory)
            }
        }catch(err){
            console.error('Error en el controlador addCategory')
        }
    }

    static updateCategory = async (req: Request, res:Response) => {
        try{
            const categoryId = req.params.categoryId
            const updatedCategory = await categoriesServices.updateOneCategory(categoryId, req.body)
            res.status(201).json(updatedCategory)
        }catch(err){
            console.error('Error en el controlador updateCategory')
        }
    }

    static deleteCategory = async (req:Request, res:Response) => {
        try{
            const categoryId = req.params.categoryId
            await categoriesServices.deleteOneCategory(categoryId)
            res.status(200)
        }catch(err){
            console.error('Error en el controlador deleteCategory')
        }
    }
}

export default categoriesControllers