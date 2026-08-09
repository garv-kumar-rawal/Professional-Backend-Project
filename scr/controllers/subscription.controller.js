import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.model.js"

const togglesubscriber = asyncHandler( async(req, res ) => {
    const { channelId } = req.params
    
    if(!channelId){
        throw new ApiError(400, "channelId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(404, "Invalid channelId")
    }

    if(channelId == req.user._id.toString()){
        throw new ApiError(403, "you are not subscriber your own channel")
    }

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

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
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
                subscribers: { $first: "$subscribers"}
            }
        },
        {
            $project: {
                _id: 0,
                subscribers: 1,
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 } // for newest first
        },
        {
            $facet: {
                subscribers: [
                    { $skip: 0 }
                ],
                totalCount: [
                    { $count: "count"}
                ]
            }
        },
        {
            $addFields: {
                subscriberCount: { $ifNull: [{ $first: "$totalCount.count" }, 0]}
            }
        },
        {
            $project: {
                subscribers: 1,
                subscriberCount: 1
            }
        }
    ])

    return res  
        .status(200)
        .json(
            new ApiResponse(200, subscribers, "Subscribers fetched succesfully")
        )
})

const getSubscribedChannel = asyncHandler( async( req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400, "subscriberId is required")
    }

    const channel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "channelSubscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscriberCount: { $size: "$channelSubscribers" }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            subscriberCount: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: { $first: "$channel" }
            }
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                subscribedAt: 1
            }
        },
        {
            $sort : { subscribedAt: -1 }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel, "successfully fetched the subscribed channel")
        )
})

export {
    togglesubscriber,
    getUserChannelSubscribers,
    getSubscribedChannel
} 