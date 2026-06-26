console.log('server.js loaded')
import app from './app.js'
console.log('app.js loaded')
import { env } from './validator/envValidator.js'
console.log('env loaded')
import { logger } from './config/logger.js'
console.log('logger loaded')

const PORT = env.PORT || 8001

app.listen(PORT, () => {
    logger.info(`Server running on PORT ${PORT}`)
})
console.log(`Server running on PORT ${env.PORT}`)