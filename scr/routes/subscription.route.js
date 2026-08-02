import { Router } from "express";
import {
    togglesubscriber,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/c/:channelID")
    .patch(togglesubscriber)

export default router