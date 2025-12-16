import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/auth.js"

const app = express()
app.use(cors())
app.use(express.json())
app.get("/", (req, res) => {
    res.send("APi is running");
})
app.use("/api/auth", authRoutes);
const PORT = 5000;
app.listen(PORT, () => {
    console.log("server is running on", PORT)
})