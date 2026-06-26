import { Router } from "express";
import rateLimiter from "../middleware/ratelimiter.js";
import {createPaste,getPaste,getRawPaste,deletePaste,getPasteStats,getRecentPastes,getAnalytics} from "../controllers/pasteController.js"
import {validate} from '../middleware/validate.js'
import {createPasteSchema} from '../validator/pasteValidator.js'


const router = Router()

router.post('/', rateLimiter, validate(createPasteSchema), createPaste)
router.get('/recent', getRecentPastes)
router.get('/analytics', getAnalytics)
router.get('/:id', getPaste)
router.get('/:id/raw', getRawPaste)
router.get('/:id/stats', getPasteStats)
router.delete('/:id', deletePaste)

export default router