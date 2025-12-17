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
            followers: {
                where: {
                    followerId: req.userId,
                },
                select: {
                    followerId: true,
                },
            },
        },
    });

    const result = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isFollowing: u.followers.length > 0,
    }));

    res.json(result);
});



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

router.get("/stats",authMiddleware,async (req,res) => {
    const followersCount = await prisma.follow.count({
        where:{followingId:req.userId}
    })
    const followingCount = await prisma.follow.count({
        where:{followerId:req.userId}
    })
    res.json({followersCount,followingCount})
})
router.get("/list",authMiddleware,async (req,res) => {
    const followers = await prisma.follow.findMany({
        where:{followingId:req.userId},
        include:{
            follower:{select:{id:true,name:true,email:true}}

        }
    })

    const following = await prisma.follow.findMany({
        where:{followerId:req.userId},
        include:{
            following:{select:{id:true,name:true,email:true}}
        }
    })

    res.json({followers,following})
})

export default router;