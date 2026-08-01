import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const QUIZ_SIZE = 10;
const ALLOWED_DIFFICULTY = new Set(['easy', 'medium', 'hard']);
const COMPANY_POOL = ['TCS', 'Amazon', 'Google', 'Capgemini'];
const DOMAIN_KEYWORDS = {
  DSA: ['dsa', 'data structure', 'data structures', 'algorithm', 'algorithms'],
  DBMS: ['dbms', 'database', 'sql', 'normalization', 'transaction'],
  OS: ['os', 'operating system', 'cpu scheduling', 'deadlock', 'virtual memory'],
  CN: ['cn', 'computer network', 'network', 'tcp', 'udp', 'osi'],
  OOPS: ['oops', 'oop', 'object oriented', 'encapsulation', 'polymorphism', 'inheritance', 'abstraction'],
};

function stripMarkdownCodeFence(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleQuestionOptions(question) {
  const taggedOptions = question.options.map((option, index) => ({
    option,
    isCorrect: index === question.correctIndex,
  }));

  const shuffled = shuffleArray(taggedOptions);
  const correctIndex = shuffled.findIndex((item) => item.isCorrect);

  return {
    ...question,
    options: shuffled.map((item) => item.option),
    correctIndex,
  };
}

function normalizeDifficulty(value) {
  const difficulty = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ALLOWED_DIFFICULTY.has(difficulty) ? difficulty : 'hard';
}

function getDifficultyInstructions(difficulty) {
  if (difficulty === 'easy') {
    return 'Difficulty: easy. Focus on foundational placement-level CS questions with clear reasoning.';
  }

  if (difficulty === 'hard') {
    return 'Difficulty: hard. Focus on edge cases, complexity analysis, optimization trade-offs, debugging scenarios, and interview-grade reasoning.';
  }

  return 'Difficulty: medium. Focus on implementation details, practical pitfalls, and moderate complexity interview scenarios.';
}

function isTooGenericQuestion(text) {
  if (!text) return true;
  const normalized = text.toLowerCase();
  const genericMarkers = [
    'learning pattern',
    'revision strategy',
    'habit helps you improve',
    'what is the main goal of learning',
    'track your growth',
  ];

  return genericMarkers.some((marker) => normalized.includes(marker));
}

function detectPrimaryDomain(topic) {
  const normalizedTopic = (topic || '').toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedTopic.includes(keyword))) {
      return domain;
    }
  }

  return '';
}

function buildFallbackQuestions(topic, count = QUIZ_SIZE, difficulty = 'medium') {
  const safeTopic = topic || 'your selected topic';
  const requestedDomain = detectPrimaryDomain(safeTopic);
  const complexityHint = difficulty === 'hard'
    ? 'Interview focus: optimize for time/space and consider edge cases.'
    : difficulty === 'easy'
    ? 'Interview focus: base concepts with simple application.'
    : 'Interview focus: practical implementation and common pitfalls.';

  const bank = [
    {
      question: `In ${safeTopic}, what is the time complexity of binary search on a sorted array of size n?`,
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
      correctIndex: 0,
      explanation: `Binary search halves the search space each step. ${complexityHint}`,
      domain: 'DSA',
    },
    {
      question: `Which traversal of a BST returns values in sorted order?`,
      options: ['Inorder', 'Preorder', 'Postorder', 'Level order'],
      correctIndex: 0,
      explanation: `Inorder traversal of BST visits keys in non-decreasing order. ${complexityHint}`,
      domain: 'DSA',
    },
    {
      question: `In a hash table with separate chaining, the average search time is closest to which expression?`,
      options: ['O(1 + alpha)', 'O(log n)', 'O(n log n)', 'O(n^2)'],
      correctIndex: 0,
      explanation: `With load factor alpha, expected chain length is alpha. ${complexityHint}`,
      domain: 'DSA',
    },
    {
      question: `Which SQL clause is applied after GROUP BY to filter aggregated results?`,
      options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
      correctIndex: 0,
      explanation: `WHERE filters rows before grouping, HAVING filters grouped results. ${complexityHint}`,
      domain: 'DBMS',
    },
    {
      question: `If a composite index exists on (A, B), which query can use the index efficiently?`,
      options: ['WHERE A = 10', 'WHERE B = 10', 'WHERE B > 10 only', 'ORDER BY B without filtering A'],
      correctIndex: 0,
      explanation: `Leftmost prefix rule allows searching by A (or A then B), not B alone. ${complexityHint}`,
      domain: 'DBMS',
    },
    {
      question: `Which condition is necessary for deadlock according to Coffman conditions?`,
      options: ['Mutual exclusion', 'Preemption by default', 'Infinite CPU cores', 'No shared resources'],
      correctIndex: 0,
      explanation: `Mutual exclusion is one of the four required deadlock conditions. ${complexityHint}`,
      domain: 'OS',
    },
    {
      question: `What is a page fault in virtual memory systems?`,
      options: ['Referenced page is not in main memory', 'CPU pipeline flush', 'Stack overflow in recursion', 'TLB hit condition'],
      correctIndex: 0,
      explanation: `Page fault occurs when required page is absent and must be loaded from disk. ${complexityHint}`,
      domain: 'OS',
    },
    {
      question: `Which protocol provides reliable, connection-oriented transport?`,
      options: ['TCP', 'UDP', 'IP', 'ICMP'],
      correctIndex: 0,
      explanation: `TCP ensures ordered and reliable delivery using acknowledgments and retransmission. ${complexityHint}`,
      domain: 'CN',
    },
    {
      question: `In OSI model, routing primarily works at which layer?`,
      options: ['Network layer', 'Transport layer', 'Session layer', 'Data link layer only'],
      correctIndex: 0,
      explanation: `Logical addressing and routing decisions happen at Layer 3. ${complexityHint}`,
      domain: 'CN',
    },
    {
      question: `Which OOP principle allows one interface with multiple implementations?`,
      options: ['Polymorphism', 'Encapsulation', 'Inheritance', 'Abstraction only'],
      correctIndex: 0,
      explanation: `Polymorphism allows method behavior to vary by object type. ${complexityHint}`,
      domain: 'OOPS',
    },
    {
      question: `Given n elements, which sorting algorithm has worst-case O(n log n)?`,
      options: ['Merge sort', 'Bubble sort', 'Insertion sort', 'Selection sort'],
      correctIndex: 0,
      explanation: `Merge sort guarantees O(n log n) in best/average/worst cases. ${complexityHint}`,
      domain: 'DSA',
    },
    {
      question: `What is the best data structure for implementing LRU cache in O(1) average operations?`,
      options: ['Hash map + doubly linked list', 'Stack only', 'Queue only', 'Binary heap only'],
      correctIndex: 0,
      explanation: `Hash map gives fast lookup, doubly linked list maintains recency order. ${complexityHint}`,
      domain: 'DSA',
    },
  ];

  const filteredBank = requestedDomain
    ? bank.filter((question) => question.domain === requestedDomain)
    : bank;

  const sourceBank = filteredBank.length ? filteredBank : bank;

  const pool = [];
  while (pool.length < count) {
    pool.push(...shuffleArray(sourceBank));
  }

  return pool
    .slice(0, count)
    .map((question, index) => ({
      ...shuffleQuestionOptions(question),
      company: COMPANY_POOL[index % COMPANY_POOL.length],
      domain: question.domain || 'Core CS',
    }));
}

function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  for (let index = 0; index < rawQuestions.length; index += 1) {
    const question = rawQuestions[index];
    const questionText = typeof question?.question === 'string' ? question.question.trim() : '';
    const options = Array.isArray(question?.options)
      ? question.options.filter((option) => typeof option === 'string' && option.trim()).map((option) => option.trim())
      : [];

    if (!questionText || options.length < 4 || isTooGenericQuestion(questionText)) {
      continue;
    }

    const dedupeKey = questionText.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const rawCorrect = Number.isInteger(question.correctAnswer)
      ? question.correctAnswer
      : Number.isInteger(question.correctIndex)
      ? question.correctIndex
      : 0;

    const limitedOptions = options.slice(0, 4);
    const boundedCorrect = Math.max(0, Math.min(limitedOptions.length - 1, rawCorrect));
    normalized.push({
      question: questionText,
      options: limitedOptions,
      correctIndex: boundedCorrect,
      explanation: typeof question?.explanation === 'string' ? question.explanation.trim() : '',
      company: typeof question?.company === 'string' ? question.company.trim() : '',
      domain: typeof question?.domain === 'string' ? question.domain.trim() : '',
    });
  }

  return normalized.map(shuffleQuestionOptions);
}

function extractTopic(body) {
  const directTopic = typeof body?.topic === 'string' ? body.topic.trim() : '';
  if (directTopic) return directTopic;

  const skillTitles = Array.isArray(body?.skills)
    ? body.skills
        .map((skill) => (typeof skill?.title === 'string' ? skill.title.trim() : ''))
        .filter(Boolean)
    : [];

  if (skillTitles.length > 0) {
    return skillTitles.join(', ');
  }

  return '';
}

export async function POST(request) {
  let body = {};

  try {
    const rawBody = await request.text();
    body = rawBody ? JSON.parse(rawBody) : {};
    const finalTopic = extractTopic(body);
    const difficulty = normalizeDifficulty(body?.difficulty);
    const requestedDomain = detectPrimaryDomain(finalTopic);

    if (!finalTopic) {
      return NextResponse.json(
        { error: 'Please enter a valid topic name' },
        { status: 400 }
      );
    }

    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

    if (!ai) {
      return NextResponse.json({
        success: true,
        topic: finalTopic,
        difficulty,
        questions: buildFallbackQuestions(finalTopic, QUIZ_SIZE, difficulty),
      });
    }

    const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const difficultyInstruction = getDifficultyInstructions(difficulty);
    const domainInstruction = requestedDomain
      ? `Strict domain constraint: all ${QUIZ_SIZE} questions must be from ${requestedDomain} only. Do not include other domains.`
      : 'Domain distribution: include DSA, OOPS, DBMS, OS, CN and at least 2 code/output reasoning questions.';

    const prompt = `Generate exactly ${QUIZ_SIZE} unique multiple-choice questions for the topic: "${finalTopic}".
    Audience: BTech Computer Science placement preparation.
    Company style: mix inspired by TCS, Amazon, Google, and Capgemini screening/interview rounds.
    ${domainInstruction}
    ${difficultyInstruction}
    At least 7 questions must be scenario-based or application-based (not definitions).
    Avoid basic trivia, motivational learning questions, and beginner-level recall-only questions.
    Include realistic distractor options close to the correct answer.
    Each question must test a different sub-concept and should not repeat wording.
    Output must be in English.
    Randomization seed: ${nonce}

    Return ONLY a raw JSON array of objects. Example format:
    [
      {
        "id": 1,
        "question": "What is ...?",
        "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
        "correctAnswer": 0,
        "explanation": "Short explanation",
        "company": "Amazon",
        "domain": "DSA"
      }
    ]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = typeof response?.text === 'string' ? response.text : response?.output_text || '';
    const cleanText = stripMarkdownCodeFence(rawText);
    const parsed = JSON.parse(cleanText);
    const transformed = normalizeQuestions(parsed);
    const domainAlignedQuestions = requestedDomain
      ? transformed.filter((question) => (question.domain || '').toUpperCase() === requestedDomain)
      : transformed;

    if (!domainAlignedQuestions.length) {
      return NextResponse.json({
        success: true,
        topic: finalTopic,
        difficulty,
        questions: buildFallbackQuestions(finalTopic, QUIZ_SIZE, difficulty),
      });
    }

    const completedQuestions = [
      ...domainAlignedQuestions,
      ...buildFallbackQuestions(finalTopic, QUIZ_SIZE, difficulty),
    ].slice(0, QUIZ_SIZE);

    return NextResponse.json({ success: true, topic: finalTopic, difficulty, questions: completedQuestions });
  } catch (error) {
    console.error('Gemini API Error:', error);
    const topic = extractTopic(body);
    const difficulty = normalizeDifficulty(body?.difficulty);

    return NextResponse.json({
      success: true,
      topic,
      difficulty,
      questions: buildFallbackQuestions(topic || 'your selected topic', QUIZ_SIZE, difficulty),
    }, { status: 200 });
  }
}