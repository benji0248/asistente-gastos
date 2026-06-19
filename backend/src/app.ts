import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/users'
import expensesRoutes from './routes/expenses'
import categoriesRoutes from './routes/categories'
import accountsRoutes from './routes/accounts'
import statementsRoutes from './routes/statements'
import householdRoutes from './routes/household'
import bootstrapRoutes from './routes/bootstrap'
import { verifyJWT } from './controllers/verifyJWT'
import { verifyOwnership } from './middlewares/verifyOwnership'
import { loadHouseholdContext } from './middlewares/loadHouseholdContext'
import { preloadJwks } from './lib/jwt'

dotenv.config()

const app = express()
app.disable('x-powered-by')

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-type', 'Authorization'],
  credentials: true,
}))

const api = express.Router()

api.get('/', (_req, res) => {
  res.send('API running')
})

api.use(verifyJWT)
api.use('/bootstrap', bootstrapRoutes)
api.use('/users', userRoutes)
api.use('/household', loadHouseholdContext, householdRoutes)
api.use('/:userId/expenses', loadHouseholdContext, verifyOwnership, expensesRoutes)
api.use('/:userId/categories', loadHouseholdContext, verifyOwnership, categoriesRoutes)
api.use('/:userId/accounts', loadHouseholdContext, verifyOwnership, accountsRoutes)
api.use('/:userId/statements', loadHouseholdContext, verifyOwnership, statementsRoutes)

app.use('/api', api)

if (process.env.VERCEL) {
  app.use(api)
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Error interno del servidor' })
})

export default app

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  const supabaseUrl = process.env.SUPABASE_URL

  void preloadJwks(supabaseUrl ?? '').catch((err) => {
    console.warn('No se pudieron precargar las claves JWT de Supabase', err)
  })

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  const shutdown = () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
