import Paste from '../models/pasteModel.js'
import redis from '../config/redis.js'
import { getFromS3 } from '../services/s3.service.js'

// GET /
export const getHomePage = async (req, res,next) => {
  try {
    const [pastes, totalCount] = await Promise.all([
      Paste.find().sort({ createdAt: -1 }).limit(8).select('shortId title language createdAt'),
      Paste.countDocuments()
    ])

    res.render('index', { pastes, totalCount })
  } catch (err) {
    next(err)
  }
}

// GET /:id
export const getPastePage = async (req, res, next) => {
  try {
    const { id } = req.params
    const cacheKey = `paste:${id}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      await redis.incr(`views:${id}`)
      return res.render('paste', { paste: JSON.parse(cached) })
    }

    const paste = await Paste.findOne({ shortId: id })
    if (!paste) return res.render('404')

    let content = paste.content
    if (paste.s3Key) {
      content = await getFromS3(paste.s3Key)
    }

    await redis.incr(`views:${id}`)
    res.render('paste', { paste: { ...paste.toObject(), content } })
  } catch (err) {
    next(err)
  }
}

// GET /:id/stats
export const getStatsPage = async (req, res, next) => {
  try {
    const { id } = req.params

    const paste = await Paste.findOne({ shortId: id })
    if (!paste) return res.render('404')

    const views = await redis.get(`views:${id}`) || 0

    res.render('stats', {
      paste: paste.toObject(),
      views: Number(views),
      storage: paste.s3Key ? 'S3' : 'MongoDB',
    })
  } catch (err) {
    next(err)
  }
}

export const getAnalyticsPage = async (req, res, next) => {
  try {
    res.render('analytics')
  } catch (err) {
    next(err)
  }
}