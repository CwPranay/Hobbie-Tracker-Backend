import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/auth.js"
import habitRoutes from "./routes/habits.js";
import friendsRoutes from "./routes/freinds.routes.js";
import activityRoutes from "./routes/activity.routes.js";






const app = express()
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://hobbie-tracker.vercel.app"
    ],
    credentials: true
}));

app.use(express.json())
app.get("/", (req, res) => {
    res.send("APi is running");
})
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/activity", activityRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log("server is running on", PORT)
})