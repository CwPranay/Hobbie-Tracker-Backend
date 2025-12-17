import express from "express"
import prisma from "../prismaClient.js"
import { startOfDay, startOfWeek } from "date-fns";
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", authMiddleware, async (req, res) => {
    const { name, frequency, category } = req.body;

    if (!name || !frequency) {
        return res.status(400).json({ message: "Name and frequency required" });
    }
    try {
        const habit = await prisma.habit.create({
            data: {
                name,
                frequency,
                category,
                userId: req.userId
            }
        })
        res.status(201).json(habit);
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Habit already exists" });
        }
        res.status(500).json({ message: "Something went wrong" });


    }
})

router.get("/", authMiddleware, async (req, res) => {
    const habits = await prisma.habit.findMany({
        where: { userId: req.userId },
        include: {
            completions: {
                orderBy: { date: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const today = startOfDay(new Date());

    const result = habits.map((habit) => {
        const lastCheckIn = habit.completions[0]?.date || null;

        const checkedToday =
            lastCheckIn &&
            startOfDay(new Date(lastCheckIn)).getTime() === today.getTime();

        // calculate streak (reuse your logic)
        let streak = 0;
        let lastDate = null;

        for (const c of habit.completions) {
            if (!lastDate) {
                streak = 1;
                lastDate = c.date;
                continue;
            }

            const diff =
                habit.frequency === "DAILY"
                    ? (lastDate - c.date) / (1000 * 60 * 60 * 24)
                    : (lastDate - c.date) / (1000 * 60 * 60 * 24 * 7);

            if (Math.round(diff) === 1) {
                streak++;
                lastDate = c.date;
            } else break;
        }

        return {
            id: habit.id,
            name: habit.name,
            frequency: habit.frequency,
            category: habit.category,
            lastCheckIn,
            checkedToday,
            streak,
        };
    });

    res.json(result);
});


router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    await prisma.habit.delete({
        where: { id },
    });

    res.json({ message: "Habit deleted" });
});

router.post("/:id/checkin", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const habit = await prisma.habit.findFirst({
        where: { id, userId: req.userId }
    })
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    let date = new Date();
    date = habit.frequency === "DAILY" ? startOfDay(date) : startOfWeek(date, { weekStartsOn: 1 })
    try {
        const completion = await prisma.habitCompletion.create({
            data: { habitId: habit.id, date },
        });
        res.status(201).json({ message: "Checked in", completion });
    } catch (e) {
        if (e.code === "P2002")
            return res.status(400).json({ message: "Already checked in" });
        res.status(500).json({ message: "Error" });
    }
})

router.get("/:id/progress", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const habit = await prisma.habit.findFirst({
        where: { id, userId: req.userId },
        include: {
            completions: {
                orderBy: {
                    date: "desc"
                }
            }
        }
    })
    if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
    }

    let streak = 0
    let lastDate = null;

    for (const c of habit.completions) {
        if (!lastDate) {
            streak = 1;
            lastDate = c.date;
            continue;
        }
        const diff = habit.frequency === "DAILY" ? (lastDate - c.date) / (1000 * 60 * 60 * 24) : (lastDate - c.date) / (1000 * 60 * 60 * 24 * 7);
        if (Math.round(diff) === 1) {
            streak++;
            lastDate = c.date;
        }
        else {
            break;
        }
    }
    res.json({
        habit: habit.name,
        frequency: habit.frequency,
        totalCheckIns: habit.completions.length,
        currentStreak: streak,
    })
})

export default router;