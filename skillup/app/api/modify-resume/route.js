
import { NextResponse } from 'next/server';

const GEMINI_MODEL = 'gemini-2.0-flash';

function cloneResumeData(currentData) {
  return {
    ...currentData,
    education: Array.isArray(currentData.education) ? [...currentData.education] : [],
    projects: Array.isArray(currentData.projects) ? [...currentData.projects] : [],
    achievements: Array.isArray(currentData.achievements) ? [...currentData.achievements] : [],
    certifications: Array.isArray(currentData.certifications) ? [...currentData.certifications] : [],
    skills: {
      technical: '',
      libraries: '',
      coreConcepts: '',
      softSkills: '',
      ...(currentData.skills && typeof currentData.skills === 'object' ? currentData.skills : {}),
    },
  };
}

function mergeCsv(existingText, items) {
  const existing = (existingText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const incoming = Array.isArray(items) ? items : [items];
  const seen = new Set();
  const merged = [];

  [...existing, ...incoming]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });

  return merged.join(', ');
}

function extractQuotedText(text) {
  const match = text.match(/"([^"]{3,120})"|'([^']{3,120})'/);
  return (match?.[1] || match?.[2] || '').trim();
}

function inferTechStack(promptText) {
  const lower = promptText.toLowerCase();
  const stack = [];
  const mapping = [
    ['python', 'Python'],
    ['javascript', 'JavaScript'],
    ['react', 'React'],
    ['next.js', 'Next.js'],
    ['node', 'Node.js'],
    ['sql', 'SQL'],
    ['mongodb', 'MongoDB'],
    ['postgres', 'PostgreSQL'],
    ['pandas', 'Pandas'],
    ['numpy', 'NumPy'],
    ['scikit', 'Scikit-learn'],
    ['tensorflow', 'TensorFlow'],
    ['keras', 'Keras'],
    ['html', 'HTML'],
    ['css', 'CSS'],
  ];

  mapping.forEach(([needle, label]) => {
    if (lower.includes(needle)) stack.push(label);
  });

  return stack.length ? stack.join(', ') : 'Relevant tools and technologies';
}

function extractProjectTitle(prompt) {
  const quotedText = extractQuotedText(prompt);
  if (quotedText) return quotedText;

  const titleMatch = prompt.match(/(?:project|called|named|titled)\s+([A-Za-z0-9][A-Za-z0-9\s\-:&]{3,80})/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  const cleaned = prompt
    .replace(/\b(i\s+)?(built|build|developed|develop|created|create|implemented|implement|made|worked on|worked upon)\b/i, '')
    .replace(/\b(using|with|for)\b.*$/i, '')
    .trim();

  return cleaned.split(/[.;\n]/)[0].slice(0, 80).trim() || 'Additional Project';
}

function extractProjectDescription(prompt, title) {
  const cleaned = prompt.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '').trim();
  const firstSentence = cleaned.split(/\.(?!\d)|\n/).map((item) => item.trim()).filter(Boolean)[0];

  if (firstSentence && firstSentence.length > 20) {
    return firstSentence.replace(/^[:\-\s]+/, '').replace(/\s+/g, ' ').trim();
  }

  return prompt.replace(/\s+/g, ' ').trim();
}

function extractProjectBullets(prompt, title, techStack) {
  const lower = prompt.toLowerCase();
  const bullets = [];
  const actionSentence = title && prompt.includes(title)
    ? prompt.replace(title, '').trim()
    : prompt;

  if (/dashboard|ui|interface|frontend/.test(lower)) {
    bullets.push('Designed a clean and responsive interface to present project outcomes clearly.');
  }
  if (/analysis|analyz|visual|chart|report/.test(lower)) {
    bullets.push('Analyzed data and created meaningful insights through structured processing and visualization.');
  }
  if (/automation|automated|workflow/.test(lower)) {
    bullets.push('Implemented automation logic to reduce manual effort and improve reliability.');
  }
  if (/machine learning|ml|model|classification|prediction|predic/i.test(lower)) {
    bullets.push('Integrated model-driven logic to support prediction and decision-making.');
  }
  if (/database|sql|storage|backend/.test(lower)) {
    bullets.push('Managed structured data flow with persistence and retrieval logic.');
  }

  if (bullets.length === 0) {
    bullets.push('Implemented the core requirements described for the project.');
  }

  bullets.push(`Tech stack: ${techStack}.`);

  return bullets.slice(0, 3);
}

function createProjectEntry(prompt) {
  const title = extractProjectTitle(prompt);
  const techStack = inferTechStack(prompt);
  const description = extractProjectDescription(prompt, title);
  return {
    title,
    description,
    bullets: extractProjectBullets(prompt, title, techStack),
    techStack,
  };
}

function buildFallbackResume(currentData, userPrompt) {
  const next = cloneResumeData(currentData);
  const prompt = (userPrompt || '').trim();
  const lower = prompt.toLowerCase();
  const hasSkillIntent = /\b(skill|skills|technologies|tech stack|tools)\b/.test(lower);
  const hasProjectIntent = /\b(project|build|developed|created|implemented)\b/.test(lower);
  const hasAchievementIntent = /\b(achievement|award|hackathon|participat|competition|certificate|certification)\b/.test(lower);
  const quotedText = extractQuotedText(prompt);

  if (hasSkillIntent) {
    const skillText = quotedText || prompt
      .replace(/.*\b(skill|skills|technologies|tech stack|tools)\b[:\-]?/i, '')
      .split(/[.;\n]/)[0]
      .trim();

    const items = skillText
      .split(/,|\band\b|\/|\+|\|/i)
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length) {
      next.skills.technical = mergeCsv(next.skills.technical, items);
      next.skills.coreConcepts = mergeCsv(next.skills.coreConcepts, items.filter((item) => /data structure|algorithm|database|network|os|oop|system/i.test(item)));
    }
  }

  if (hasProjectIntent) {
    const project = createProjectEntry(prompt);

    const existingTitles = new Set(next.projects.map((projectItem) => String(projectItem?.title || '').toLowerCase()));
    if (!existingTitles.has(project.title.toLowerCase())) {
      next.projects = [project, ...next.projects];
    }
  }

  if (hasAchievementIntent) {
    if (!next.achievements.some((item) => String(item).toLowerCase() === prompt.toLowerCase())) {
      next.achievements = [prompt, ...next.achievements];
    }
  }

  if (/\b(certification|certificate|course)\b/.test(lower)) {
    if (!next.certifications.some((item) => String(item).toLowerCase() === prompt.toLowerCase())) {
      next.certifications = [prompt, ...next.certifications];
    }
  }

  if (/\b(summary|objective|profile)\b/.test(lower)) {
    next.summary = prompt.length > 20 ? prompt : `${next.summary} ${prompt}`.trim();
  }

  return next;
}

export async function POST(request) {
  try {
    const { currentData, userPrompt } = await request.json();

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json({ success: false, error: "Instruction prompt is required" }, { status: 400 });
    }

    if (!currentData) {
      return NextResponse.json({ success: false, error: "Current resume data is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is missing on the server. Add it to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const systemInstruction = `
You are an expert ATS-optimized Resume Compiler.
Your task is to take the existing resume data JSON and update it based on the user's instructions.

CRITICAL RULES:
1. Return a JSON object with EXACTLY these top-level keys: name, email, phone, linkedin, githubProfile, summary, education, projects, skills, achievements, certifications.
2. "education" and "projects" are arrays of objects; "projects" objects have: title, description, bullets (array of strings), techStack.
3. "education" objects have: degree, institution, duration, details.
4. "skills" is an object with: technical, libraries, coreConcepts, softSkills (all strings).
5. "achievements" and "certifications" are arrays of strings.
6. Never drop or rename existing fields. Only change what the user's instruction asks for, and add new items (e.g. a new project) in the same shape as existing items.
7. Write any new content in professional, ATS-friendly language with active verbs.
  8. If the user asks to add a project, keep the same resume style as the existing projects: concise title, one-sentence description, 2-3 relevant bullets, and a techStack string.
  9. Never dump the raw prompt into the resume fields; summarize it into professional resume language.
  10. Return ONLY the raw JSON object. No markdown code fences, no explanation, no extra text before or after.
`.trim();

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemInstruction}\n\nCurrent Resume JSON:\n${JSON.stringify(currentData)}\n\nUser Update Command:\n${userPrompt}`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("Gemini API error:", response.status, errBody);
        if (response.status === 401) {
          const fallbackUpdatedData = buildFallbackResume(currentData, userPrompt);
          return NextResponse.json({
            success: true,
            fallbackUsed: true,
            warning: 'Gemini key rejected, so a local fallback update was applied.',
            updatedData: fallbackUpdatedData,
          });
        }
        return NextResponse.json(
          { success: false, error: `Gemini API responded with status ${response.status}. Check server logs for details.` },
          { status: 502 }
        );
      }

      const apiData = await response.json();

      const rawText = apiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        console.error("Unexpected Gemini response shape:", JSON.stringify(apiData));
        const fallbackUpdatedData = buildFallbackResume(currentData, userPrompt);
        return NextResponse.json({
          success: true,
          fallbackUsed: true,
          warning: 'Gemini returned an unexpected response format, so a local fallback update was applied.',
          updatedData: fallbackUpdatedData,
        });
      }

      let cleanText = rawText.trim();
      if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
      if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
      if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);
      cleanText = cleanText.trim();

      let parsedUpdatedData;
      try {
        parsedUpdatedData = JSON.parse(cleanText);
      } catch (parseErr) {
        console.error("JSON parse failed. Raw text was:", cleanText);
        const fallbackUpdatedData = buildFallbackResume(currentData, userPrompt);
        return NextResponse.json({
          success: true,
          fallbackUsed: true,
          warning: 'Gemini returned invalid JSON, so a local fallback update was applied.',
          updatedData: fallbackUpdatedData,
        });
      }

      // Basic shape check so a malformed response can't wipe the whole resume
      const requiredKeys = ['name', 'email', 'projects', 'skills'];
      const missing = requiredKeys.filter((k) => !(k in parsedUpdatedData));
      if (missing.length > 0) {
        console.error("Parsed data missing keys:", missing);
        const fallbackUpdatedData = buildFallbackResume(currentData, userPrompt);
        return NextResponse.json({
          success: true,
          fallbackUsed: true,
          warning: `Gemini response was missing expected fields: ${missing.join(', ')}. A local fallback update was applied.`,
          updatedData: fallbackUpdatedData,
        });
      }

      return NextResponse.json({ success: true, updatedData: parsedUpdatedData });
    } catch (geminiErr) {
      console.error('Gemini request failed, using local fallback:', geminiErr);
      const fallbackUpdatedData = buildFallbackResume(currentData, userPrompt);
      return NextResponse.json({
        success: true,
        fallbackUsed: true,
        warning: 'AI update used a local fallback because Gemini was unavailable.',
        updatedData: fallbackUpdatedData,
      });
    }

  } catch (error) {
    console.error("Resume compilation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process resume update. Check server terminal for details." },
      { status: 500 }
    );
  }
}