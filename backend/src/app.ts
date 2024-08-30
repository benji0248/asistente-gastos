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

const app = express();
app.disable('x-powered-by')

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-type', 'Authorization'],
    credentials:true,
}));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('API running');
});

app.use('/register', registerRoute)
app.use('/login', loginRoute)
app.use('/refresh', refresh)
app.use('/logout', logoutRoute)
app.use(verifyJWT)
app.use('/users', userRoutes);
app.use('/:userId/expenses', expensesRoutes)
app.use('/:userId/categories', categoriesRoutes)
app.use('/accounts', accountsRoutes);
app.use('/:userId/accounts', accountsRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});