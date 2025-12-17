import express from "express"
import prisma from "../prismaClient.js"
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/search", authMiddleware, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
            ],
            NOT: { id: req.userId },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });
    res.json(users)
})

router.post("/follow/:id", authMiddleware, async (req, res) => {
    const followingId = req.params.id;

    if (followingId === req.userId) {
        return res.status(400).json({ message: "You cannot follow Yourself" })

    }
    try {
        await prisma.follow.create({
            data: {
                followerId: req.userId,
                followingId,
            }
        });
        res.json({ message: "Followed Successfully" })
    } catch (error) {

        if (error.code === "P2002") {
            return res.status(400).json({ message: "Already following" });
        }
        res.status(500).json({ message: "Something went wrong" });


    }
})

router.delete("/unfollow/:id", authMiddleware, async (req, res) => {
    const followingId = req.params.id;

    await prisma.follow.delete({
        where: {
            followerId_followingId: {
                followerId: req.userId,
                followingId,
            },
        },
    });

    res.json({ message: "Unfollowed successfully" });
});

export default router;