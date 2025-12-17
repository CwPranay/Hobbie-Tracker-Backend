import prisma from "../prismaClient.js";


export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    if (following.length === 0) {
      return res.json([]);
    }

    const followingIds = following.map(f => f.followingId);

    const feed = await prisma.habitCompletion.findMany({
      where: {
        habit: {
          userId: {
            in: followingIds
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30,
      select: {
        createdAt: true,
        habit: {
          select: {
            name: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json(
      feed.map(item => ({
        user_id: item.habit.user.id,
        user_name: item.habit.user.name,
        habit_name: item.habit.name,
        created_at: item.createdAt
      }))
    );
  } catch (err) {
    
    res.status(500).json({ message: "Failed to load activity feed" });
  }
};
