import { Router } from 'express'
import bootstrapControllers from '../controllers/bootstrapControllers'

const bootstrapRoutes = Router()

bootstrapRoutes.post('/', bootstrapControllers.setup)

export default bootstrapRoutes
