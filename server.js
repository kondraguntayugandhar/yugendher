import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

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
        const { aptitudeCount = 15, reasoningCount = 15, javaCount = 5 } = req.body;
        
        console.log(`[+] Generating new AI Test Strategy: ${aptitudeCount} Apt, ${reasoningCount} Reas, ${javaCount} Java...`);

        const prompt = `Generate a JSON object containing a strictly formatted TCS NQT practice test.
        This must be completely UNIQUE and different from previous responses. Use this random seed: ${Math.random().toString(36).substring(7)}
        
        Include exactly:
        - ${aptitudeCount} Aptitude (Quantitative) questions (Vary topics: Time/Work, Probability, Geometry, Algebra, Logic, Data Interpretation)
        - ${reasoningCount} Logical Reasoning questions (Vary topics: Syllogisms, Seating Arrangements, Blood Relations, Coding-Decoding)
        - ${javaCount} Java programming coding challenges (Vary topics: Arrays, Strings, HashMaps, Dynamic Programming, Math)
        
        For the Java questions, ensure they simulate actual modern TCS NQT coding questions. Include problem statements, exactly 2 test case examples with input/output, and a list of constraints.
        
        IMPORTANT: Your response MUST be valid JSON only. Do not wrap in markdown blocks.
        
        Format Requirement:
        {
            "aptitude": [ { "question": "", "options": ["A. ", "B. ", "C. ", "D. "], "correctAnswer": "" } ],
            "reasoning": [ { "question": "", "options": ["A. ", "B. ", "C. ", "D. "], "correctAnswer": "" } ],
            "java": [ { "title": "", "description": "", "examples": [{"input":"", "output":""}], "constraints": [] } ]
        }`;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { temperature: 0.9 } 
        }); // Using 2.5-flash for speed/formatting with high temp for variety
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON formatting if Gemini adds markdown block
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const testData = JSON.parse(jsonStr);

        // Store session state to tie evaluation to the test generated
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
        const { sessionId, userId = 'guest', answers, aptitudeAnswers, reasoningAnswers, testData } = req.body;
        
        // Verify session
        const session = activeSessions.get(userId);
        if (!session || session.sessionId !== sessionId) {
            return res.status(400).json({ error: "Invalid or expired test session." });
        }

        // Process Java Code Submissions
        let codeSubmissionsStr = "";
        if (answers && typeof answers === 'object') {
            for (const [index, code] of Object.entries(answers)) {
                if(code.trim().length > 0 && !code.includes('// Write your solution here:')) {
                    codeSubmissionsStr += `\n--- Question ${parseInt(index)+1} Submission ---\n\`\`\`java\n${code}\n\`\`\`\n`;
                }
            }
        }

        if (codeSubmissionsStr.length === 0) {
            codeSubmissionsStr = "Student submitted no code or only blank boilerplate templates.";
        }

        // Stringify the multiple-choice context
        const mcqContext = `
        Original Aptitude Questions: ${JSON.stringify(testData?.aptitude || [])}
        Student's Aptitude Answers: ${JSON.stringify(aptitudeAnswers || {})}
        
        Original Reasoning Questions: ${JSON.stringify(testData?.reasoning || [])}
        Student's Reasoning Answers: ${JSON.stringify(reasoningAnswers || {})}
        `;

        const prompt = `Act as a Strict Proctor and Senior Staff Engineer evaluating a TCS NQT Exam submission. The user has submitted up to 5 Java coding solutions and answers to Aptitude & Reasoning questions.
        
        PART 1: JAVA CODE ANALYSIS
        Student Code Submissions:
        ${codeSubmissionsStr}
        Analyze all provided Java code for logic correctness, Time Complexity, Space Complexity, and edge case handling.
        
        PART 2: MCQ ANALYSIS
        ${mcqContext}
        Compare the Student's Answers to the correctAnswer for each aptitude and reasoning question. Identify which ones the student got wrong.
        
        Return a strict JSON object with exactly these keys:
        - "score": A cumulative number between 0 and 100 combining Java correctness and MCQ accuracy.
        - "logicEfficiency": A general efficiency string for the Java code (e.g., "O(N) - 85%").
        - "optimizationTips": A string array containing 2 specific Java tips.
        - "bugsSquashed": An integer of how many potential Java errors were found.
        - "rankUpdate": One of "Ninja", "Digital", or "Prime" based on the total score.
        - "aiPush": A short, motivational 1-sentence critique based on overall performance.
        - "incorrectQuestions": An array of objects for the MCQ questions the student got WRONG. (If perfect, return empty array []). Each object must have:
            - "questionText": The original question string.
            - "userAnswer": What the student guessed.
            - "correctAnswer": The actual correct answer.
            - "aiExplanation": A short 1-2 sentence explanation of WHY the correct answer is true and where the user's logic failed.
        
        IMPORTANT: Your response MUST be valid JSON only. Do not wrap in markdown blocks.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
