import { Router } from 'express'
import categoriesControllers from '../controllers/categoriesControllers'
import { verifyRoles } from '../controllers/verifyRoles';
import { ROLES_LIST } from '../config/role_list';

const categoriesRoutes = Router({mergeParams:true});

categoriesRoutes.get('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), categoriesControllers.getAllCategories);
categoriesRoutes.post('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), categoriesControllers.addCategory);
categoriesRoutes.get('/:categoryId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), categoriesControllers.getCategory);
categoriesRoutes.put('/:categoryId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), categoriesControllers.updateCategory);
categoriesRoutes.delete('/:categoryId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), categoriesControllers.deleteCategory);

export default categoriesRoutes;