import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        video: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

playlistSchema.index(
    { title: 1, owner: 1 },
    { unique: 1 }
)

export const Playlist = mongoose.model("Playlist", playlistSchema)