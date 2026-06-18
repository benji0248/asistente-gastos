import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/users'
import expensesRoutes from './routes/expenses'
import categoriesRoutes from './routes/categories'
import accountsRoutes from './routes/accounts'
import { verifyJWT } from './controllers/verifyJWT'
import { verifyOwnership } from './middlewares/verifyOwnership'

dotenv.config()

const app = express()
app.disable('x-powered-by')

const allowedOrigins = [
  'http://localhost:5173',
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
api.use('/users', userRoutes)
api.use('/:userId/expenses', verifyOwnership, expensesRoutes)
api.use('/:userId/categories', verifyOwnership, categoriesRoutes)
api.use('/accounts', accountsRoutes)
api.use('/:userId/accounts', verifyOwnership, accountsRoutes)

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
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}
