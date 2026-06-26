import redis from "../config/redis.js";
import { logger } from "../config/logger.js";
// Sliding window rate limiter with max 10 requests per 60 seconds per IP

const LIMIT = 10
const WINDOW = 60

const rateLimiter = async(req,res,next) => {
    const ip = req.ip
    const key = `rate:${ip}`
    const now = Date.now()
    const windowStart = now - WINDOW*6000 

    try{
        // remove requests older than the window by the set key from beginning(0) to this timestamp (windowStart)
        await redis.zremrangebyscore(key,0,windowStart)

        // count requests in current window
        const count = await redis.zcard(key)

        //  return error if requests more than 10 req
        if(count >= LIMIT){
            return res.status(429).json({
                error : "Too many Requests.max 10 pastes per minute"
            })
        }

        // add current request timestamp if less than 10 req
        await redis.zadd(key,now,`${now}`)

        // expire key after window
        await redis.expire(key, WINDOW)

        next()

    } catch(err){
        // add current request timestamp
        logger.error('rate limiter error :', err);
        next()
    }
}

export default rateLimiter