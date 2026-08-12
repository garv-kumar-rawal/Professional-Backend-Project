import { mongoose, isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { comment } from "../models/comment.model.js"

const getVideoComment = asyncHandler( async(req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }


})


export {
    getVideoComment
}