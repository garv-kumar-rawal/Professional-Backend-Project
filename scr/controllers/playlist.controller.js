import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async( req, res) => {

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

const getUserPlaylist = asyncHandler(async( req, res) => {

    const { userId } = req.params

    if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(404, "Invalid User")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideo: { $size: "$videos" },
                totalView: { $sum: "$videos.view" },
                thumbnail: { $first: "$video.thumbnail" }
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                totalVideo: 1,
                totalView: 1,
                thumbnail: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "The Playlist fetch successfully")
        )
})
export {
    createPlaylist,
    getUserPlaylist,
}
