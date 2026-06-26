export const validate = (schema) => (req,res,next) => {
    const result = schema.safeParse(req.body)

    if(!result.success){
        return res.status(400).json({
            error : 'Validation Failed',
            issues : result.error.issues.map((e) =>({
                field : e.path[0],
                message : e.message
            }))
        })
    }
    req.body = result.data
    next()
}