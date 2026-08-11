import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { comment } from "../models/comment.model.js"

const getVideoComment = asyncHandler( async(req, res) => {

})


export {
    getVideoComment
}