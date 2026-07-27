import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId").get(getPlaylistById)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/user/:userId").get(getUserPlaylist)


export default router