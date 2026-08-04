import { Router } from "express";
import {
    togglesubscriber,
    getUserChannelSubscribers,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/c/:channelId")
    .get(getUserChannelSubscribers)
    .patch(togglesubscriber)


export default router