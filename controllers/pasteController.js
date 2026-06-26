import { nanoid } from "nanoid";
import Paste from "../models/pasteModel.js";
import redis from "../config/redis.js"
import {isLargePaste,uploadToS3,getFromS3,deleteFromS3} from "../services/s3.service.js"

export const EXPIRY_SECONDS = {
    '1h' : 60*60,
    '1d' : 60*60*24,
    '1w' : 60*60*24*7,
    'never' : null
}

// POST /api/pastes
export const createPaste = async (req,res,next) => {
    try{
        const {title, content, language, expiry = '1d'} = req.body

        const ttlSeconds = EXPIRY_SECONDS[expiry]
        const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds*1000) : null

        const shortId = nanoid(8)
        let s3Key = null
        let storedContent = content

        if(isLargePaste(content)){
          s3Key = await uploadToS3(shortId,content)
          storedContent = null
        }

        const paste = await Paste.create({
            shortId,
            title,
            content: storedContent,
            language,
            expiresAt,
            s3Key
        })

        const cacheKey = `paste:${paste.shortId}`
        const cacheValue = JSON.stringify({ ...paste.toObject(), content })

        if (ttlSeconds) {
            await redis.set(cacheKey, cacheValue, 'EX', ttlSeconds)
        } else {
            await redis.set(cacheKey, cacheValue)
        }

        res.status(201).json(paste)
    }catch(err){
        next(err)
    }
}

// GET /api/pastes/:id
export const getPaste = async(req,res,next) => {
    try {
        const {id} = req.params
        const cacheKey = `paste:${id}`

        // checking redis cache first
        const cached = await redis.get(cacheKey)
        if(cached){
            await redis.incr(`views:${id}`)
            return res.json({...JSON.parse(cached), source : 'cache'})
        }

        // fallback to MongoDB
        const paste = await Paste.findOne({shortId :  id})
        if(!paste) return res.status(404).json({error : 'paste not found'})


        let content = paste.content
        if (paste.s3Key) {
          content = await getFromS3(paste.s3Key)
        }

        const ttl = paste.expiresAt ? Math.floor((new Date(paste.expiresAt) - Date.now()) / 1000) : 300

        if(ttl > 0){
            await redis.set(cacheKey, JSON.stringify({...paste.toObject(),content}), 'EX', ttl)
        }

        // increment view count
        await redis.incr(`views:${id}`)

        res.json({ ...paste.toObject(), content,source: 'db' })
    } catch (err) {
        next(err)
    }
}

// GET /api/pastes/:id/raw
export const getRawPaste = async (req, res,next) => {
  try {
    const { id } = req.params
    const cached = await redis.get(`paste:${id}`)

    if (cached) {
      const paste = JSON.parse(cached)

      return res
        .type('text/plain')
        .send(paste.content)
    }

    const paste = await Paste.findOne({
      shortId: id
    })

    if (!paste) return res.status(404).send('Not found')

    let content = paste.content
    if (paste.s3Key) {
      content = await getFromS3(paste.s3Key)
    }

    const ttl = paste.expiresAt ? Math.floor((new Date(paste.expiresAt) - Date.now()) / 1000) : 300

    if(ttl > 0){
        await redis.set(`paste:${id}`, JSON.stringify({ ...paste.toObject(), content }), 'EX', ttl)
    }
        

    res.type('text/plain').send(paste.content)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/pastes/:id
export const deletePaste = async (req, res,next) => {
  try {
    const { id } = req.params

    const paste = await Paste.findOne({ shortId: id })
    if (!paste) return res.status(404).json({ error: 'Paste not found' })

    if (paste.s3Key) {
      await deleteFromS3(paste.s3Key)
    }

    await Paste.deleteOne({ shortId: id })
    await redis.del(`paste:${id}`)
    await redis.del(`views:${id}`)
    res.json({ message: 'Deleted' })
  } catch (err) {
    next(err)
  }
}

// GET /api/pastes/:id/stats
export const getPasteStats = async (req, res,next) => {
  try {
    const { id } = req.params

    const paste = await Paste.findOne({ shortId: id }, 'shortId title language createdAt expiresAt s3Key')
    if (!paste) return res.status(404).json({ error: 'Paste not found' })

    const views = await redis.get(`views:${id}`) || 0

    res.json({
      shortId: paste.shortId,
      title: paste.title,
      language: paste.language,
      views: Number(views),
      createdAt: paste.createdAt,
      expiresAt: paste.expiresAt,
      storage: paste.s3Key ? 'S3' : 'MongoDB',
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/pastes/recent
export const getRecentPastes = async (req, res, next) => {
  try {
    const pastes = await Paste.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('shortId title language createdAt')

    res.json(pastes)
  } catch (err) {
    next(err)
  }
}

// GET /api/analytics
// GET /api/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const [totalPastes, s3Pastes, languageStats] = await Promise.all([
      Paste.countDocuments(),
      Paste.countDocuments({ s3Key: { $ne: null } }),
      Paste.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ])

    const totalViews = await redis.keys('views:*')
    let viewCount = 0
    for (const key of totalViews) {
      const val = await redis.get(key)
      viewCount += parseInt(val) || 0
    }

    res.json({
      totalPastes,
      s3Pastes,
      mongoPastes: totalPastes - s3Pastes,
      totalViews: viewCount,
      languageStats,
    })
  } catch (err) {
    next(err)
  }
}