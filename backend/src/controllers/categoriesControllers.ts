import { Request, Response } from 'express'
import categoriesServices from '../config/categoriesServices'

class categoriesControllers {
  private static visibleUserIds = (req: Request) => req.visibleUserIds ?? (req.userId ? [req.userId] : [])

  static getAllCategories = async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === 'true'
      const categories = await categoriesServices.getCategories(this.visibleUserIds(req), activeOnly)
      if (categories) res.status(200).json(categories)
    } catch (err) {
      console.error('Error en el controlador getCategories', err)
    }
  }

  static getCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId
      const rows = await categoriesServices.getOneCategory(categoryId)
      const row = rows?.find((category) => this.visibleUserIds(req).includes(category.user_id))
      if (row) res.status(200).json(row)
      else res.sendStatus(404)
    } catch (err) {
      console.error('Error en el controlador getCategory', err)
    }
  }

  static addCategory = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId
      if (userId && this.visibleUserIds(req).includes(userId)) {
        await categoriesServices.createOneCategory(userId, req.body)
        const categories = await categoriesServices.getCategories(this.visibleUserIds(req))
        res.status(201).json(categories)
      } else {
        res.sendStatus(403)
      }
    } catch (err) {
      console.error('Error en el controlador addCategory')
    }
  }

  static updateCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId
      const updates: { name?: string; is_enabled?: boolean } = {}
      if (typeof req.body.name === 'string') updates.name = req.body.name
      if (typeof req.body.is_enabled === 'boolean') updates.is_enabled = req.body.is_enabled

      await categoriesServices.updateOneCategory(categoryId, updates, this.visibleUserIds(req))
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Error en el controlador updateCategory', err)
    }
  }

  static deleteCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId
      await categoriesServices.deleteOneCategory(categoryId, this.visibleUserIds(req))
      res.sendStatus(204)
    } catch (err) {
      console.error('Error en el controlador deleteCategory', err)
      res.status(400).json({ message: 'No se pudo eliminar la categoría' })
    }
  }
}

export default categoriesControllers
