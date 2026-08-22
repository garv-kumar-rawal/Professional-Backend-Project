import mongoose, { isValidObjectId } from "mongoose"
import  { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Tweet } from "../models/tweet.model.js"

const getUserTweet = asyncHandler( async( req, res ) => {
    const { userId } = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id")
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }, 
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails"},
                likeCount: { $size: "$likes"},
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: { createAt: -1}
        },
        {
            $project: {
                conatent: 1,
                owner: 1,
                likeCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1

            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet Fetched Successfully")
        )
})

const createTweet = asyncHandler( async( req, res ) => {

    const { content } = req.body

    if(!content || !content.trim()){
        throw new ApiError(400, "tweet content is required")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(500, "Something went wrong while create tweet")
    }

    const responseTweet = {
        _id: tweet._id,
        content: content.trim(),
        owner: {
            _id: req.user._id,
            userName: req.user.username,
            fullName: req.user.fullName,
            avatar: req.user.avatar
        },
        likeCount: 0,
        isLiked: false,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, responseTweet, "Tweet created successfully")
        )
})

const updateTweet = asyncHandler( async( req, res ) => {
    const { tweetId } = req.params
    const { content } = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    if(!content || !content.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() != req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const UpdatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            returnDocument: "after"
        }
    )

    if(!UpdatedTweet){
        throw new ApiError(500, "Something went wrong while updating the Tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, UpdatedTweet, "Tweet update successfully")
        )
})

const deleteTweet = asyncHandler( async( req, res ) => {
    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(400, "tweet ID is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() != req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(500, "Something went wrong while deleting the Tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet delete Successfully")
        )
})

export {
    getUserTweet,
    createTweet,
    updateTweet,
    deleteTweet
}

