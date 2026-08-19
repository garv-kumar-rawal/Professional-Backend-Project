import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getUserTweet 
        } from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/:userId").get(getUserTweet)

export default router