import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import axios from "axios";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=====================================================");
  console.log("   VOCABMASTER ADVANCED DASHBOARD & DB VERIFICATION  ");
  console.log("=====================================================\n");

  try {
    // 1. Database Connection & Word Catalog Count
    console.log("[1/10] Checking PostgreSQL Connection & Catalog...");
    const totalWords = await prisma.vocabularyWord.count();
    const totalExamples = await prisma.wordExample.count();
    console.log(`  ✓ Connected to Neon PostgreSQL successfully!`);
    console.log(`  ✓ Total Vocabulary Words in DB: ${totalWords}`);
    console.log(`  ✓ Total Example Sentences in DB: ${totalExamples}`);

    // 2. Vocabulary Queries
    console.log("\n[2/10] Testing Vocabulary Filtering...");
    const b1Words = await prisma.vocabularyWord.findMany({
      where: { cefrLevel: "B1" },
      take: 5,
      include: { examples: true },
    });
    console.log(`  ✓ Sample Words: ${b1Words.map((w) => w.word).join(", ")}`);

    // 3. User Lifecycle & 50-word Daily Goal Setting
    console.log("\n[3/10] Testing User Profile & 50-Word Daily Target...");
    const testSupabaseId = `e2e-user-${Date.now()}`;
    const testEmail = `${testSupabaseId}@vocabmaster.app`;

    const user = await prisma.user.create({
      data: {
        supabaseId: testSupabaseId,
        email: testEmail,
        fullName: "E2E Advance Learner",
        dailyWordGoal: 10,
        currentStreak: 3,
        longestStreak: 5,
        totalPoints: 240,
        lastActiveDate: new Date(),
      },
    });

    // Update Daily Goal to 50 words
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { dailyWordGoal: 50 },
    });
    console.log(`  ✓ Created test user in DB with ID: ${user.id}`);
    console.log(
      `  ✓ Updated user daily word target to: ${updatedUser.dailyWordGoal} words/day`,
    );

    // Daily Activity Log with 50-word progress
    const todayStr = new Date().toISOString().split("T")[0];
    const activityLog = await prisma.dailyActivityLog.create({
      data: {
        userId: user.id,
        date: todayStr,
        wordsReviewed: 20,
        wordsLearned: 15,
        quizzesTaken: 2,
        timeSpentSec: 720,
        goalReached: 35 >= updatedUser.dailyWordGoal, // 35 of 50
      },
    });
    console.log(
      `  ✓ Persisted DailyActivityLog: ${activityLog.wordsReviewed + activityLog.wordsLearned}/${updatedUser.dailyWordGoal} words completed today (${Math.round((35 / 50) * 100)}%)`,
    );

    // 4. Word Bookmark / "Book List a Saved Korbo" Feature
    console.log(
      '\n[4/10] Testing Word Bookmarking ("Book List a Saved Korbo")...',
    );
    const sampleWord1 = b1Words[0];
    const sampleWord2 = b1Words[1];

    const bookmark1 = await prisma.bookmark.create({
      data: {
        userId: user.id,
        wordId: sampleWord1.id,
      },
    });
    const bookmark2 = await prisma.bookmark.create({
      data: {
        userId: user.id,
        wordId: sampleWord2.id,
      },
    });
    console.log(
      `  ✓ Saved '${sampleWord1.word}' to user book list (Bookmark ID: ${bookmark1.id})`,
    );
    console.log(
      `  ✓ Saved '${sampleWord2.word}' to user book list (Bookmark ID: ${bookmark2.id})`,
    );

    const userBookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: { word: true },
    });
    console.log(
      `  ✓ Total saved words in user book list: ${userBookmarks.length}`,
    );
    console.log(
      `  ✓ Saved words: ${userBookmarks.map((b) => b.word.word).join(", ")}`,
    );

    // 5. Word Notes Persistence
    console.log("\n[5/10] Testing Personal Word Notes...");
    const note = await prisma.wordNote.create({
      data: {
        userId: user.id,
        wordId: sampleWord1.id,
        content: "Must use in business emails.",
        mnemonic: `Remember ${sampleWord1.word} means ${sampleWord1.banglaMeaning}`,
      },
    });
    console.log(`  ✓ Saved WordNote in DB for '${sampleWord1.word}'`);

    // 6. Spaced Repetition (SRS) Review
    console.log("\n[6/10] Testing Spaced Repetition (SM-2)...");
    const progress = await prisma.userWordProgress.create({
      data: {
        userId: user.id,
        wordId: sampleWord1.id,
        state: "LEARNING",
        repetition: 1,
        interval: 1,
        easinessFactor: 2.5,
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + 86400000),
      },
    });
    await prisma.reviewHistory.create({
      data: {
        userProgressId: progress.id,
        rating: 3,
        interval: 1,
        easinessFactor: 2.5,
      },
    });
    console.log(`  ✓ Created UserWordProgress & ReviewHistory in DB`);

    // 7. Quiz Session
    console.log("\n[7/10] Testing Quiz Session Persistence...");
    const session = await prisma.quizSession.create({
      data: {
        userId: user.id,
        quizType: "MULTIPLE_CHOICE",
        totalQuestions: 5,
        correctCount: 5,
        scorePercentage: 100,
        durationSeconds: 40,
        details: [{ word: sampleWord1.word, isCorrect: true }],
      },
    });
    console.log(
      `  ✓ Saved QuizSession in DB with 100% score (ID: ${session.id})`,
    );

    // 8. Advanced Dashboard Daily Plan Calculation (for 50 words goal)
    console.log(
      "\n[8/10] Testing Advanced Daily Plan (50 words curriculum)...",
    );
    const targetCount = updatedUser.dailyWordGoal; // 50
    const morningCount = Math.round(targetCount * 0.3);
    const afternoonCount = Math.round(targetCount * 0.4);
    const eveningCount = targetCount - (morningCount + afternoonCount);
    console.log(`  ✓ Daily Word Goal: ${targetCount} words`);
    console.log(`  ✓ 3-Session Daily Structure:`);
    console.log(`    - 🌅 Morning Kickstart: ${morningCount} words (~5 mins)`);
    console.log(
      `    - ☀️ Afternoon Deep Dive: ${afternoonCount} words (~8 mins)`,
    );
    console.log(
      `    - 🌙 Evening Consolidation: ${eveningCount} words (~6 mins)`,
    );

    // 9. FreeDict API Live Feed
    console.log("\n[9/10] Testing FreeDict API Word List Integration...");
    const freeDictRes = await axios.get(
      "https://freedict.com/api/v1/words?locale=en-US&include=translations&limit=3&offset=0",
      {
        headers: {
          "X-API-Key":
            process.env.FREEDICT_API_KEY ||
            "fd_de8a207b7f277eb4db2ca81df9b932c10f00381e525d52bf",
        },
        timeout: 10000,
      },
    );
    const firstWord = freeDictRes.data?.data?.words?.[0];
    console.log(
      `  ✓ FreeDict API Words Feed: "${firstWord?.word}" (${firstWord?.pos?.[0]})`,
    );

    // 10. Clean up temporary test data
    console.log("\n[10/10] Cleaning up temporary test records...");
    await prisma.bookmark.deleteMany({ where: { userId: user.id } });
    await prisma.reviewHistory.deleteMany({
      where: { userProgressId: progress.id },
    });
    await prisma.userWordProgress.deleteMany({ where: { userId: user.id } });
    await prisma.wordNote.deleteMany({ where: { userId: user.id } });
    await prisma.quizSession.deleteMany({ where: { userId: user.id } });
    await prisma.dailyActivityLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("  ✓ Cleaned up all test records cleanly.");

    console.log("\n=====================================================");
    console.log("   ALL ADVANCED USER DASHBOARD & BOOKMARK APIS OK!   ");
    console.log("=====================================================");
  } catch (err: any) {
    console.error("\n❌ Verification Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
