import { NextResponse } from 'next/server';

function buildSampleQuestions(topic) {
  return [
    {
      id: 1,
      question: `What is a primary characteristic of ${topic}?`,
      options: [
        `Core concept execution in ${topic}`,
        'Unrelated syntax structure',
        'Deprecated legacy framework',
        'Hardware component type',
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      question: `Which data structure or method is most frequently used in ${topic}?`,
      options: [
        'Static Memory allocation',
        'Dynamic standard collections',
        'Linear array shifting',
        'Unindexed text files',
      ],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: `What is the best practice when handling exceptions or optimization in ${topic}?`,
      options: [
        'Ignore runtime alerts',
        'Hardcode system parameters',
        'Use modular handling and structured logic',
        'Avoid clean code formatting',
      ],
      correctAnswer: 2,
    },
  ];
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, topic, questions: buildSampleQuestions(topic) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}