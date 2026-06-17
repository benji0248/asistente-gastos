import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/users'
import expensesRoutes from './routes/expenses'
import categoriesRoutes from './routes/categories'
import registerRoute from './routes/register'
import accountsRoutes from './routes/accounts'
import loginRoute from './routes/login'
import { verifyJWT } from './controllers/verifyJWT'
import cookieParser from 'cookie-parser'
import refresh from './api/refresh'
import logoutRoute from './routes/logout'

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

app.use(cookieParser())

const api = express.Router()

api.get('/', (_req, res) => {
  res.send('API running')
})

api.use('/register', registerRoute)
api.use('/login', loginRoute)
api.use('/refresh', refresh)
api.use('/logout', logoutRoute)
api.use(verifyJWT)
api.use('/users', userRoutes)
api.use('/:userId/expenses', expensesRoutes)
api.use('/:userId/categories', categoriesRoutes)
api.use('/accounts', accountsRoutes)
api.use('/:userId/accounts', accountsRoutes)

app.use('/api', api)

// En Vercel el rewrite puede entregar la ruta sin el prefijo /api
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
