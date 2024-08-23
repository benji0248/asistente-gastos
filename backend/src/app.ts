import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/userRoutes'
import expensesRoutes from './routes/expensesRoutes'
import categoriesRoutes from './routes/categoriesRoutes'

dotenv.config()

const app = express();
app.disable('x-powered-by')

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('API running');
});

app.use('/usuarios', userRoutes);
app.use('/usuarios/:userId/gastos', expensesRoutes)
app.use('/usuarios/:userId/categorias', categoriesRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});