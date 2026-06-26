import Redis from "ioredis";
import {env} from '../validator/envValidator.js'
import { logger } from "./logger.js";
const redis = new Redis({
    host : env.REDIS_HOST || 'localhost',
    port : env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 5
})

redis.on('ready', () => {
    logger.info('Redis Connected')
})
redis.on('error', (err) => logger.error('Redis error :', err))

export default redis