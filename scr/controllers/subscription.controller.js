import { mongoose } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.model.js"

const togglesubscriber = asyncHandler( async(req, res ) => {
    const { channelId } = req.params
    
})

export {

} 