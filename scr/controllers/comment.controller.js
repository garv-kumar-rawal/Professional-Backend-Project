import { mongoose, isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"

const getVideoComment = asyncHandler( async(req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not Found ")
    }

    const commentPipeline = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likeCount: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [ req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }   
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                likeCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(commentPipeline, options)

    console.log("videoId being tested:", videoId)
    console.log("count:", await Comment.countDocuments({ video: videoId }))
    console.log("docs:", await Comment.find({ video: videoId }))

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comment fetched successfully")
        )
})


export {
    getVideoComment
}