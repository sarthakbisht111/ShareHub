import { logger } from "../config/logger.js";

export const errorHandler = (err,req,res,_next) => {
    logger.error(err);

    if(err.name === 'ValidationError'){
        return res.status(400).json({
            error : 'Validation error',
            issues : Object.values(err.errors).map((e) => ({
                field : e.path,
                message : e.message
            }))
        })
    }

    if(err.code === 11000){
        return res.status(400).json({error : 'Duplicate Entry'})
    }

    res.status(err.status || 500).json({
        error : err.message || 'Internal Server Error'
    })
    
}