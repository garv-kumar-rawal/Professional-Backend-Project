import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({ extended: true, limit: '10kb'}))

app.use(express.static('public'))
app.use(cookieParser())

//import routes
import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.route.js'
import likeRouter from './routes/like.route.js'
import playlistRouter from './routes/playlist.route.js'
import subscriptionRouter from "./routes/subscription.route.js"


//router declaration
app.use('/api/v1/users', userRouter)  //use the "/" before the api/v1/users
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/likes', likeRouter)
app.use('/api/v1/playlists', playlistRouter)
app.use('/api/v1/subscriptions', subscriptionRouter)

// http://localhost:8000/api/v1/users/register

export { app }