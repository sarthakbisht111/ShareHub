import 'dotenv/config'
import { z } from 'zod'


const envSchema = z.object({
    PORT : z.coerce.number().min(1).max(65535).default(8001),

    REDIS_HOST: z.string().min(1),

    REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),

    MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\/.+/),

    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),

    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),

    AWS_REGION: z.string().min(1),

    S3_BUCKET_NAME: z.string().min(1),

})


export const env = envSchema.parse(process.env)