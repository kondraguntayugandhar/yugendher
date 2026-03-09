/**
 * app.js - Vanilla JS interactions for the TCS NQT Simulator UI
 */

document.addEventListener('DOMContentLoaded', () => {

    // Unlimited Practice Mode - Timer removed

    // Exam Page logic is already handled inline in exam.html for Monaco Editor and Timer.
    
    // --- AI Question Bank ---
    const questionBank = {
        aptitude: [
            {
                id: "apt_1",
                question: "A pipe can fill a tank in 15 hours. Due to a leak in the bottom, it is filled in 20 hours. If the tank is full, how much time will the leak take to empty it?",
                options: ["40 hours", "50 hours", "60 hours", "70 hours"],
                correctAnswer: "60 hours"
            },
            {
                id: "apt_2",
                question: "A series is given as: 1, 1, 2, 3, 4, 9, 8, 27, 16, 81, 32, 243, 64, 729... What is the next term?",
                options: ["128", "2187", "256", "1024"],
                correctAnswer: "128"
            },
            {
                id: "apt_3",
                question: "Two trains running in opposite directions cross a man standing on the platform in 27 seconds and 17 seconds respectively and they cross each other in 23 seconds. The ratio of their speeds is:",
                options: ["1:3", "3:2", "3:4", "None of these"],
                correctAnswer: "3:2"
            }
        ],
        reasoning: [
            {
                id: "reas_1",
                question: "Choose the word which is different from the rest: (A) Chicken (B) Snake (C) Swan (D) Crocodile (E) Frog",
                options: ["Chicken", "Snake", "Swan", "Crocodile", "Frog"],
                correctAnswer: "Chicken"
            },
            {
                id: "reas_2",
                question: "If A + B means A is the brother of B; A x B means A is the father of B; A ÷ B means A is the mother of B, which of the following would mean 'M is the son of P'?",
                options: ["P x M", "P ÷ M", "P x M + N", "P ÷ M x N"],
                correctAnswer: "P x M + N"
            },
            {
                id: "reas_3",
                question: "In a certain code language, '134' means 'good and tasty'; '478' means 'see good pictures' and '729' means 'pictures are faint'. Which of the following digits stands for 'see'?",
                options: ["4", "7", "8", "9"],
                correctAnswer: "8"
            }
        ],
        java: [
            {
                id: "java_1",
                title: "The Chocolate Factory (Array Manipulation)",
                description: "A chocolate factory is packing chocolates into packets. Some packets are empty (represented by 0). Your task is to find all the empty packets in a given array and push them to the end of the conveyor belt (the end of the array) while maintaining the relative order of the non-empty packets.",
                examples: [
                    { input: "8\n4 5 0 1 9 0 5 0", output: "4 5 1 9 5 0 0 0" }
                ],
                constraints: [
                    "N (size of array) <= 10^5",
                    "You must use standard input (Scanner or BufferedReader)",
                    "Output must contain only the result array separated by spaces. No 'Enter number' prompts."
                ]
            },
            {
                id: "java_2",
                title: "String Rotation (Advanced Pointers)",
                description: "Given two strings s1 and s2, write a function to check if s2 is a rotation of s1. For example, 'waterbottle' is a rotation of 'erbottlewat'. You must do this using only one call to the substring (or equivalent) method.",
                examples: [
                    { input: "waterbottle\nerbottlewat", output: "true" },
                    { input: "hello\nworld", output: "false" }
                ],
                constraints: [
                    "Lengths of s1 and s2 <= 10^5",
                    "Expected Time Complexity: O(N)",
                    "Expected Space Complexity: O(N)"
                ]
            },
            {
                id: "java_3",
                title: "Matrix Search (2D Search)",
                description: "Write an efficient algorithm that searches for a value in an m x n matrix. This matrix has the following properties: Integers in each row are sorted from left to right. The first integer of each row is greater than the last integer of the previous row.",
                examples: [
                    { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n3", output: "true" }
                ],
                constraints: [
                    "m, n <= 100",
                    "Expected Time Complexity: O(log(m*n))"
                ]
            }
        ]
    };

    // Helper: Pick a random, unplayed question
    function getNextQuestion(category) {
        let history = JSON.parse(localStorage.getItem('testHistory') || '{}');
        if(!history[category]) history[category] = [];
        
        const available = questionBank[category].filter(q => !history[category].includes(q.id));
        
        // If all played, wipe history for category and start over
        if(available.length === 0) {
            history[category] = [];
            localStorage.setItem('testHistory', JSON.stringify(history));
            return questionBank[category][Math.floor(Math.random() * questionBank[category].length)];
        }
        
        const selected = available[Math.floor(Math.random() * available.length)];
        // Mark as played
        history[category].push(selected.id);
        localStorage.setItem('testHistory', JSON.stringify(history));
        return selected;
    }

    function generateQuestionSet(category, count) {
        let set = [];
        for(let i=0; i<count; i++) {
            // We clone the object and append an index to the ID so UI keys remain unique if it loops the bank
            let q = Object.assign({}, getNextQuestion(category));
            q.uniqueId = q.id + "_" + i;
            set.push(q);
        }
        return set;
    }

    // Connect Frontend natively (No Backend Required)
    const startFoundationBtn = document.getElementById('start-foundation-btn');
    if (startFoundationBtn) {
        startFoundationBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const originalText = startFoundationBtn.innerHTML;
            startFoundationBtn.innerHTML = '<span class="mr-3 text-lg"><i class="ph ph-spinner animate-spin"></i> BUILDING FOUNDATION TEST...</span>';
            startFoundationBtn.classList.add('cursor-not-allowed', 'opacity-80');

            try {
                setTimeout(() => {
                    const mockTestData = {
                        tier: 'Foundation',
                        timeLimitMinutes: 80, // 20 mins for Aptitude/Reasoning + 60 mins for Java
                        aptitude: generateQuestionSet('aptitude', 15),
                        reasoning: generateQuestionSet('reasoning', 15),
                        java: generateQuestionSet('java', 5)
                    };
                    
                    localStorage.setItem('currentTestSession', 'foundation-session-' + Date.now());
                    localStorage.setItem('currentTestData', JSON.stringify(mockTestData));
                    window.location.href = 'exam.html';
                }, 1200);

            } catch (err) {
                console.error(err);
                alert('An error occurred loading the mock test.');
                startFoundationBtn.innerHTML = originalText;
                startFoundationBtn.classList.remove('cursor-not-allowed', 'opacity-80');
            }
        });
    }

    const startAdvancedBtn = document.getElementById('start-advanced-btn');
    if (startAdvancedBtn) {
        startAdvancedBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const originalText = startAdvancedBtn.innerHTML;
            startAdvancedBtn.innerHTML = '<span class="mr-3 text-lg"><i class="ph ph-spinner animate-spin"></i> BUILDING ADVANCED TEST...</span>';
            startAdvancedBtn.classList.add('cursor-not-allowed', 'opacity-80');

            try {
                setTimeout(() => {
                    const mockTestData = {
                        tier: 'Advanced',
                        timeLimitMinutes: 80, // 20 mins for Aptitude/Reasoning + 60 mins for Java
                        aptitude: generateQuestionSet('aptitude', 10),
                        reasoning: generateQuestionSet('reasoning', 10),
                        java: generateQuestionSet('java', 5)
                    };
                    
                    localStorage.setItem('currentTestSession', 'advanced-session-' + Date.now());
                    localStorage.setItem('currentTestData', JSON.stringify(mockTestData));
                    window.location.href = 'exam.html';
                }, 1200);

            } catch (err) {
                console.error(err);
                alert('An error occurred loading the mock test.');
                startAdvancedBtn.innerHTML = originalText;
                startAdvancedBtn.classList.remove('cursor-not-allowed', 'opacity-80');
            }
        });
    }

    // Manual Smoke Test Loader (Bypasses Backend API for manual testing)
    const smokeTestBtn = document.getElementById('smoke-test-btn');
    if (smokeTestBtn) {
        smokeTestBtn.addEventListener('click', () => {
            const smokeTestData = {
                tier: 'Smoke Test (Mini)',
                timeLimitMinutes: 30, 
                aptitude: generateQuestionSet('aptitude', 2), // small sets for quick debugging
                reasoning: generateQuestionSet('reasoning', 2),
                java: generateQuestionSet('java', 1)
            };
            
            localStorage.setItem('currentTestSession', 'smoke-test-session-' + Date.now());
            localStorage.setItem('currentTestData', JSON.stringify(smokeTestData));
            window.location.href = 'exam.html';
        });
    }

    // Smooth transitions for hover states (handled mostly by CSS, but added here if complex JS logic is later needed)
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0px)';
        });
    });

});
