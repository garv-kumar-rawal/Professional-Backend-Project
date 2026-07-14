import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Like } from '../models/like.model.js';
import { Video } from '../models/video.model.js';


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"))
    }
    console.log("complate: ")

    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    if (!newLike) {
        throw new ApiError(500, "Failed to like the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"))

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const like = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: { 
                            ownerDetails: {$first: "$ownerDetails" }
                        }
                    },
                    {
                        $project: {
                            videoFiles: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            ownerDetails: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $match: {
                "video.isPublished": true
            }
        },
        {
            $project: {
                _id: 1,
                video: 1,
                likedAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, like, "liked video retrieved successfully"))
})

export {
    toggleVideoLike,
    getLikedVideos,
}