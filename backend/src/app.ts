import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/userRoutes'
import expensesRoutes from './routes/expensesRoutes'
import categoriesRoutes from './routes/categoriesRoutes'
import registerRoute from './routes/registerRoute'
import accountsRoutes from './routes/accountsRoutes'

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

app.get('/', (req, res) => {
    res.send('API running');
});

app.use('/register', registerRoute)
app.use('/users', userRoutes);
app.use('/:userId/expenses', expensesRoutes)
app.use('/:userId/categories', categoriesRoutes)
app.use('/accounts', accountsRoutes);
app.use('/:userId/accounts', accountsRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});