import mongoose, { isValidObjectId } from "mongoose"
import  { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
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

export {
    getUserTweet
}

