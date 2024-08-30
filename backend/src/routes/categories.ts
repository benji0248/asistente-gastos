import { Router } from 'express'
import categoriesControllers from '../controllers/categoriesControllers'

const categoriesRoutes = Router({mergeParams:true});

categoriesRoutes.get('/', categoriesControllers.getAllCategories);
categoriesRoutes.post('/', categoriesControllers.addCategory);
categoriesRoutes.get('/:categoryId', categoriesControllers.getCategory);
categoriesRoutes.put('/:categoryId', categoriesControllers.updateCategory);
categoriesRoutes.delete('/:categoryId', categoriesControllers.deleteCategory);

export default categoriesRoutes;