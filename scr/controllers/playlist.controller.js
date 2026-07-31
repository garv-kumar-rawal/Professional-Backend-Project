import { isValidObjectId, mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

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

    // the is a issue in the video, video views and video total in getUserPlaylist and getPlaylistById

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

const getPlaylistById = asyncHandler(async(req ,res) => {
    const { playlistId } = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(404, "Invalid Playlist Id")
    }

    const existPlaylist = await Playlist.findById(playlistId);

    if(!existPlaylist){
        throw new ApiError(404, "Playlist not found")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        "avatar.url": 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.view" }
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                video: 1,
                owner: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1

            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params

    console.log("req: ", req.params)

    if(!videoId && !playlistId){
        throw new ApiError(400, "Video and Playlist Id is required")
    }

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Video and playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    const video = await Video.findById(videoId)

    console.log(playlist)

    if(!playlist){
        throw new ApiError(404, "The playlist not found")
    }

    if(!video){
        throw new ApiError(404, "The Video not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you are not authorized to modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { video: videoId }
        },
        { new: true }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while adding the vidoe")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
        )
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params

    if(!videoId && !playlistId){
        throw new ApiError(400, "video and playlist Id is required")
    }

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid video and playlist Id")
    }

    const video = await Video.findById(videoId)

    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authprized to remove the vidoe from the playlsit")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { video: videoId }
        },
        { new: true }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "something went wrong while removing video form the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Video remove from playlist successfully")
        )
}) 

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params

    if(!playlistId){
        throw new ApiError(400, "Playlist Id is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, "Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you are not authorized to delete the playlist")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletePlaylist){
        throw new ApiError(500, "something went wrong while deleting the playlist")
    }

    return res  
        .status(200)
        .json(200, {}, "Playlist delete successfully")
})

const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params
    const { title, description } = req.body

    if(!playlistId){
        throw new ApiError(400, "playlist Id is required")
    }

    if(!title || title.trim() ==""){
        throw new ApiError(400, "Title is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update the playlist")
    }

    const existingPlaylist = await Playlist.findOne({
        _id: { $ne: playlistId},
        owner: req.user._id,
        title: title.trim()
    })

    if(existingPlaylist){
        throw new ApiError(409, "You already have this playlist with this title")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                title: title.trim(),
                description: description || ""
            }
        },
        { new: true }
    )

    if(!updatePlaylist){
        throw new ApiError(500, "something went wrong while updating the playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated Successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
