import { Router } from 'express'
import {
  getHomePage,getPastePage,getStatsPage,getAnalyticsPage} from '../controllers/viewController.js'

const router = Router()

router.get('/', getHomePage)
router.get('/paste/:id', getPastePage)
router.get('/paste/:id/stats', getStatsPage)
router.get('/analytics', getAnalyticsPage)
export default router