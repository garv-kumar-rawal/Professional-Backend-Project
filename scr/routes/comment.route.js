import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
        } from "../controllers/comment.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").get(getVideoComment).post(addComment)
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router