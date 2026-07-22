import { mongoose } from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async( req, res) => {
    console.log("req.body: ", req.body)
    const { title, description } = req.body

    if(!title || title.trim()==""){
        throw new ApiError(400, "Title Field is required")
    }

    try {
        const playlist = await Playlist.create({
            title: title.trim(),
            description: description || "",
            video: [],
            owner: req.user._id
        })
    
        return res
            .status(200)
            .json(200, playlist, "playlist create successfully")
    
    } catch (error) {
        if(error.code==11000){   // 11000 code of the mongoDB insert the duplicate field
            throw new ApiError(404, "you already have a playlist with this name")
        }
        throw error
    }
})

export {
    createPlaylist,
}
