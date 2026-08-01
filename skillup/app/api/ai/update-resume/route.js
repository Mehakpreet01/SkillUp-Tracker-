import { NextResponse } from 'next/server';

function toUniqueCsv(existingText, incomingValue) {
  const existing = (existingText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const incoming = (incomingValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();

  [...existing, ...incoming].forEach((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped.join(', ');
}

function getDefaultResumeData() {
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    githubProfile: '',
    summary: '',
    education: [],
    projects: [],
    skills: {
      technical: '',
      libraries: '',
      coreConcepts: '',
      softSkills: '',
    },
    achievements: [],
    certifications: [],
  };
}

function parseResumeText(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
    return getDefaultResumeData();
  }

  try {
    const parsed = JSON.parse(resumeText);
    if (parsed && typeof parsed === 'object') {
      const base = getDefaultResumeData();
      return {
        ...base,
        ...parsed,
        skills: {
          ...base.skills,
          ...(parsed.skills && typeof parsed.skills === 'object' ? parsed.skills : {}),
        },
        education: Array.isArray(parsed.education) ? parsed.education : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      };
    }
  } catch {
    // Stored text might be plain text from old versions. We intentionally fall back.
  }

  return getDefaultResumeData();
}

export async function POST(request) {
  try {
    const { resumeText, newSkill } = await request.json();
    const skillTitle = typeof newSkill?.title === 'string' ? newSkill.title.trim() : '';
    const skillDescription = typeof newSkill?.description === 'string' ? newSkill.description.trim() : '';

    if (!skillTitle) {
      return NextResponse.json({ success: false, error: 'Skill title is required' }, { status: 400 });
    }

    const current = parseResumeText(resumeText);
    const next = {
      ...current,
      skills: {
        ...current.skills,
        technical: toUniqueCsv(current.skills?.technical, skillTitle),
      },
    };

    if (skillDescription) {
      const lower = skillDescription.toLowerCase();
      if (/(tree|graph|sorting|sql|dbms|network|os|oop|react|node|api|python|javascript|c\+\+|java)/i.test(lower)) {
        next.skills.coreConcepts = toUniqueCsv(current.skills?.coreConcepts, skillTitle);
      }
    }

    return NextResponse.json({
      success: true,
      updatedData: next,
      updatedResume: JSON.stringify(next),
    });
  } catch (error) {
    console.error('Update resume skill API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resume with the new skill.' },
      { status: 500 }
    );
  }
}
