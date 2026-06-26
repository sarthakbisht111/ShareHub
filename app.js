import express from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import {env} from './validator/envValidator.js'
import helmet from 'helmet'
import compression from "compression";
import pasteRoutes from "./routes/pasteRoute.js"
import {errorHandler} from './middleware/errorHandler.js'
import { logger } from "./config/logger.js";
import { pinoHttp } from "pino-http";
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import viewRoutes from './routes/viewRoutes.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.set('view engine', 'ejs')
app.set('views', join(__dirname, 'views'))
app.use(express.static(join(__dirname, 'public')))
// app.use(express.urlencoded({ extended: true }))

app.use(helmet({
  contentSecurityPolicy: false,
}))
app.use(compression())

app.use(pinoHttp({
  logger,
  customLogLevel : (req,res,err) => {
    if(res.statusCode >= 500) return 'error'
    if(res.statusCode >= 400) return 'warn'
    return 'info'
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ip: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  }
}))

app.use(express.json({limit : '1mb'}))

mongoose
  .connect(env.MONGO_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => logger.error('MongoDB error:', err))

app.use('/api/pastes', pasteRoutes)
app.use('/', viewRoutes)
app.get('/health', (req,res) => res.json({status : 'ok'}))

app.use(errorHandler)

export default app;