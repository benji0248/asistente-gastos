import { Router } from 'express'
import { categoriesControllers} from '../controllers/categoriesControllers'

const categoriesRoutes = Router();

categoriesRoutes.get('/', categoriesControllers.getAllCategories);
categoriesRoutes.post('/', categoriesControllers.addCategory);
categoriesRoutes.put('/:categoryId', categoriesControllers.updateCategory);
categoriesRoutes.delete('/:categoryId', categoriesControllers.deleteCategory);

export default categoriesRoutes;