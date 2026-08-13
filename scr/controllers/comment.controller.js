import { mongoose, isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/comment.model.js"

const getVideoComment = asyncHandler( async(req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findBy(videoId)

    if(!video){
        throw new ApiError(404, "Video not Found ")
    }

    const comment = await Comment.aggregate([
        {
            $match: {
                Video: new mongoose.Types.ObjectId(video)
            }
        }
    ])


})


export {
    getVideoComment
}