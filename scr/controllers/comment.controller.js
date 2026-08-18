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

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comment fetched successfully")
        )
})

const addComment = asyncHandler( async( req, res ) => {
    const { videoId } = req.params
    const { content } = req.body

    if(!new mongoose.Types.ObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    if(!content || !content.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(500, "Failed to add comment, try again later")
    }

    const createdComment = {
        ...comment._doc,
        owner: {
            _id: req.user._id,
            userName: req.user.username,
            fullName: req.user.fullName,
            avater: req.user.avatar
        },
        likeCount: 0,
        isLiked: false
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, createdComment, "Comment created successfully")
        )
})

const updateComment = asyncHandler( async( req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if(!new mongoose.Types.ObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    if(!content || !content.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            returnDocument: "after"
        }
    )

    if(!updatedComment){
        throw new ApiError(500, "Something went wrong while updating comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Update Comment successfully")
        )
})

const deleteComment = asyncHandler( async( req, res ) => {
    const { commentId } = req.params
    
    if(!commentId){
        throw new ApiError(400, "comment Id is required")
    }

    if(!new mongoose.Types.ObjectId(commentId)){
        throw new ApiError(404, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if(!deleteComment){
        throw new ApiError(500, "Something went wrong while deleting the comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Comment delete Successfully")
        )
})


export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}