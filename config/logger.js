import pino from 'pino'
import path from 'path'
import { env } from '../validator/envValidator.js'

const LOG_PATH = path.join(process.cwd(), 'logs', 'app.log')

const targets = [
  ...(env.NODE_ENV !== 'production'
    ? [{
        target: 'pino-pretty',
        level: 'debug',
        options: {
          destination: 1,
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:HH:MM:ss'
        }
      }]
    : []),
  {
    target: 'pino/file',
    level: 'info',
    options: {
      destination: LOG_PATH,
      append: true,
      mkdir: true
    }
  }
]

const transport = pino.transport({ targets })

export const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug'
  },
  transport
)