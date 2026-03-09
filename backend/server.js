import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory state management for active tests (Frontend deployment friendly)
const activeSessions = new Map();

/**
 * Route: /api/generate-test
 * Purpose: Connects to Gemini to generate 4 sectional questions and tracks the start time.
 */
app.post('/api/generate-test', async (req, res) => {
    try {
        const userId = req.body.userId || 'guest';
        
        // Unrestricted Mode: User can take multiple tests per day without waiting
        // We still track the active session to tie the submission grading to the generated test

        const prompt = `Generate a JSON object containing a strictly formatted TCS NQT 2026 practice test.
        Include exactly:
        - 1 Aptitude (Quant) question
        - 1 Logical Reasoning question
        - 1 Medium Java question
        - 1 Hard Java question
        
        For the Java questions, include problem statements, exactly 2 example test cases with input/output, and a list of constraints.
        Include a 30-minute time limit property.
        
        IMPORTANT: Your response MUST be valid JSON only. Do not wrap in markdown code blocks. Do not add any conversational text.
        
        Format:
        {
            "timeLimitMinutes": 30,
            "aptitude": { "question": "", "options": [], "correctAnswer": "" },
            "reasoning": { "question": "", "options": [], "correctAnswer": "" },
            "mediumJava": { "title": "", "description": "", "examples": [{"input":"", "output":""}], "constraints": [] },
            "hardJava": { "title": "", "description": "", "examples": [{"input":"", "output":""}], "constraints": [] }
        }`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5-flash for speed/formatting
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON formatting if Gemini adds markdown block
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const testData = JSON.parse(jsonStr);

        // Store session state to prevent refresh cheating
        const sessionId = crypto.randomUUID();
        activeSessions.set(userId, {
            sessionId,
            startTime: Date.now(),
            testData
        });

        res.json({
            sessionId,
            test: testData
        });

    } catch (error) {
        console.error("Error generating test:", error);
        res.status(500).json({ error: "Failed to generate AI Test." });
    }
});

/**
 * Route: /api/evaluate-submission
 * Purpose: Evaluates code against Gemini to provide Pro AI Critique, score, and Roadmap rank.
 */
app.post('/api/evaluate-submission', async (req, res) => {
    try {
        const { sessionId, userId = 'guest', code, problemId } = req.body;
        
        // Verify session (timer logic)
        const session = activeSessions.get(userId);
        if (!session || session.sessionId !== sessionId) {
            return res.status(400).json({ error: "Invalid or expired test session." });
        }

        const prompt = `Act as a Strict Proctor and Senior Staff Engineer evaluating a TCS NQT Java submission.
        
        Student Code:
        \`\`\`java
        ${code}
        \`\`\`
        
        Analyze this code for logic correctness, Time Complexity, Space Complexity, and edge case handling.
        
        Return a strict JSON object with exactly these keys:
        - "score": A number between 0 and 100 representing the total marks.
        - "logicEfficiency": A percentage string (e.g., "94%").
        - "optimizationTips": A string array containing 2 specific tips (e.g., "Use StringBuilder instead of String concatenation").
        - "bugsSquashed": An integer of how many potential errors were caught/avoided.
        - "rankUpdate": One of "Ninja", "Digital", or "Prime" based on the score (Ninja: <70, Digital: 70-90, Prime: >90).
        - "aiPush": A short, motivational 1-sentence critique to push them harder tomorrow.
        
        IMPORTANT: Your response MUST be valid JSON only. Do not wrap in markdown blocks.`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON formatting
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const evaluation = JSON.parse(jsonStr);

        res.json(evaluation);

    } catch (error) {
        console.error("Error evaluating submission:", error);
        res.status(500).json({ error: "Failed to evaluate code submission." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TCS NQT backend running on http://localhost:${PORT}`);
});
