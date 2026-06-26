import mongoose from "mongoose";

const pasteSchema = new mongoose.Schema(
    {
        shortId:{
            type: String,
            required : true,
            unique : true,
            index : true
        },
        title : {
            type : String,
            default : "untitled",
            maxlength : 100
        },
        content : {
            type : String,
            default : null
        },
        language : {
            type : String,
            default : null
        },
        expiresAt: {
        type: Date,
        default: null,
        },
        // if conteni large (>10KB), store in S3
        s3Key: {
        type: String,
        default: null,
        },
    }, {timestamps: true}
)

pasteSchema.index(
    {expiresAt : 1},
    {expireAfterSeconds : 0}
)

const Paste = mongoose.model("Paste",pasteSchema)

export default Paste