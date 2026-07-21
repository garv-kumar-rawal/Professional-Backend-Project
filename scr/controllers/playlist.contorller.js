import { mongoose } from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async( req, res) => {
    const { title, description } = req.body

    if(!title || title.trim()==""){
        throw new ApiError(200, "Title Field is required")
    }

    
})

export {
    
}
