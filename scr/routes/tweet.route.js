import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getUserTweet,
    createTweet 
        } from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/").post(createTweet)
router.route("/user/:userId").get(getUserTweet)

export default router