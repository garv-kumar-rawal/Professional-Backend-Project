import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.model.js"

const togglesubscriber = asyncHandler( async(req, res ) => {
    const { channelId } = req.params

    console.log("req.params: ", req.params)
    
    if(!channelId){
        throw new ApiError(400, "channelId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(404, "Invalid channelId")
    }

    if(channelId == req.user._id.toString()){
        throw new ApiError(403, "you are not subscriber your own channel")
    }

    console.log("req.user", req.user._id.toString())

    const existingsubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })
    
    // UNSUBSCRIBE
    if(existingsubscription){
        await Subscription.findByIdAndDelete(existingsubscription._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {subscribed: false}, "successfully Unsubscribe channel")
            )
    }

    // SUBSCRIBE
    try {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
    } catch (error) {
        if(error == 11000){
            return res
                .status(299)
                .json(
                    new ApiResponse(200, {subscribed: true}, "you are already subscribed the channel")
                )
        }
        throw error
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribed: true }, "successfully Subscribe channel")
        )
})

const getUserChannelSubscribers = asyncHandler( async(req, res) => {
    const { channelId } = req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channel Id")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channelId: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: { $first: "$subscriber"}
            }
        },
        {
            $project: {
                _id: 0,
                subscriber: 1,
                subsciberedAt: "$createdAt"
            }
        },
        {
            $sort: { subsciberedAt: -1 } // for newest first
        }
    ])

    return res  
        .status(200)
        .json(
            new ApiResponse(200, subscriber, "Subscribers fetched succesfully")
        )
})

export {
    togglesubscriber,
    getUserChannelSubscribers
} 