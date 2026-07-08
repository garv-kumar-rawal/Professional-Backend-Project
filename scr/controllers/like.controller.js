import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Like } from '../models/like.model.js';
import { Video } from '../models/video.model.js';


const toggleVideoLike = asyncHandler( async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })

    if(existingLike){
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"))
    }
    console.log("complate: ")

    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    if(!newLike){
        throw new ApiError(500, "Failed to like the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"))

})

export {
    toggleVideoLike,
}