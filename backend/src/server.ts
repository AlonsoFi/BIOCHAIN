import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/user.routes.js'
import cvmRoutes from './routes/cvm.routes.js'
import datasetsRoutes from './routes/datasets.routes.js'
import studiesRoutes from './routes/studies.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import logger from './utils/logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })
  next()
})

// Routes
app.use('/api/user', userRoutes)
app.use('/api/cvm', cvmRoutes)
app.use('/api/datasets', datasetsRoutes)
app.use('/api/studies', studiesRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware (debe ir al final, después de todas las rutas)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`🚀 Backend running on http://localhost:${PORT}`, {
    env: process.env.NODE_ENV,
    port: PORT,
  })
})

export default app

