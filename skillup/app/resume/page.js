'use client';

import { useState, useCallback, useRef } from 'react';
import Script from 'next/script';
import Navbar from '../../components/Navbar';

// ═══════════════════════════════════════════════════════
// ATS SCORING CONSTANTS
// ═══════════════════════════════════════════════════════

const ACTION_VERBS = [
  'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'built', 'collaborated', 'configured', 'contributed', 'created',
  'debugged', 'delivered', 'deployed', 'designed', 'developed',
  'directed', 'documented', 'engineered', 'enhanced', 'established',
  'executed', 'generated', 'implemented', 'improved', 'increased',
  'initiated', 'integrated', 'launched', 'led', 'maintained',
  'managed', 'mentored', 'migrated', 'optimized', 'organized',
  'pioneered', 'planned', 'produced', 'published', 'reduced',
  'refactored', 'resolved', 'scaled', 'spearheaded', 'streamlined',
  'supervised', 'tested', 'transformed', 'troubleshot', 'utilized'
];

const COMMON_TECH_KEYWORDS = [
  'javascript', 'python', 'java', 'c++', 'react', 'node', 'sql', 'html', 'css',
  'git', 'api', 'database', 'cloud', 'aws', 'docker', 'kubernetes',
  'machine learning', 'data analysis', 'agile', 'scrum', 'rest',
  'typescript', 'angular', 'vue', 'mongodb', 'postgresql',
  'ci/cd', 'devops', 'testing', 'linux', 'algorithms',
  'data structures', 'microservices', 'security', 'networking',
  'tensorflow', 'pandas', 'numpy', 'flask', 'django', 'spring'
];

const SECTION_PATTERNS = [
  { name: 'Experience / Projects', patterns: ['experience', 'work experience', 'professional experience', 'projects', 'work history', 'employment', 'internship'] },
  { name: 'Education', patterns: ['education', 'academic', 'qualification', 'degree', 'university', 'college', 'bachelor', 'master'] },
  { name: 'Skills', patterns: ['skills', 'technical skills', 'core competencies', 'proficiencies', 'technologies', 'tools'] },
  { name: 'Contact Information', patterns: ['contact', 'email', 'phone', 'address', '@', 'linkedin', 'github'] }
];

// ═══════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════

function extractKeywordsFromJD(jd) {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'not',
    'no', 'nor', 'as', 'if', 'then', 'than', 'too', 'very', 'just', 'about',
    'above', 'after', 'again', 'all', 'also', 'am', 'any', 'because',
    'before', 'between', 'both', 'each', 'few', 'more', 'most', 'other',
    'own', 'same', 'so', 'some', 'such', 'up', 'out', 'only', 'over',
    'under', 'must', 'need', 'able', 'work', 'working', 'role', 'job',
    'looking', 'seeking', 'required', 'preferred', 'including', 'etc',
    'responsible', 'responsibilities', 'position', 'candidate', 'ideal',
    'strong', 'good', 'well', 'using', 'used', 'use', 'new', 'team',
    'years', 'year', 'company', 'join', 'opportunity'
  ]);

  const text = jd.toLowerCase();

  // Extract multi-word phrases first
  const phrasePatterns = [
    'machine learning', 'deep learning', 'data science', 'data analysis',
    'project management', 'problem solving', 'version control',
    'data structures', 'object oriented', 'web development', 'full stack',
    'front end', 'frontend', 'back end', 'backend', 'ci cd', 'ci/cd',
    'unit testing', 'agile methodology', 'cloud computing',
    'artificial intelligence', 'natural language processing',
    'computer vision', 'software development', 'software engineering',
    'system design', 'rest api', 'restful api', 'user experience',
    'cross functional', 'data modeling', 'data engineering'
  ];

  const matchedPhrases = phrasePatterns.filter(phrase => text.includes(phrase));

  // Extract single important words
  const words = jd.toLowerCase()
    .replace(/[^a-z0-9\s\/\+\#\.]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  const sortedWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 25);

  return [...new Set([...matchedPhrases, ...sortedWords])];
}

function calculateKeywordScore(resumeText, jobDescription) {
  const resumeLower = resumeText.toLowerCase();
  const maxScore = 40;

  if (jobDescription && jobDescription.trim().length > 10) {
    const jdKeywords = extractKeywordsFromJD(jobDescription);
    if (jdKeywords.length === 0) {
      return { score: 20, max: maxScore, details: 'Could not extract keywords from job description.', matched: [], missing: [] };
    }

    const matched = jdKeywords.filter(kw => resumeLower.includes(kw));
    const missing = jdKeywords.filter(kw => !resumeLower.includes(kw));
    const matchPercent = matched.length / jdKeywords.length;
    const score = Math.round(matchPercent * maxScore);

    let suggestion = '';
    if (matchPercent >= 0.75) suggestion = 'Great keyword coverage! Fine-tune by adding any remaining missing keywords naturally.';
    else if (matchPercent >= 0.5) suggestion = 'Good start. Integrate the missing keywords into your experience and skills sections.';
    else suggestion = 'Low keyword match. Tailor your resume to include more relevant terms from the job description.';

    return { score, max: maxScore, details: `Matched ${matched.length}/${jdKeywords.length} keywords (${Math.round(matchPercent * 100)}%).`, suggestion, matched, missing };
  } else {
    const matched = COMMON_TECH_KEYWORDS.filter(kw => resumeLower.includes(kw));
    const matchPercent = Math.min(matched.length / 10, 1);
    const score = Math.round(matchPercent * maxScore);

    return {
      score, max: maxScore,
      details: `Found ${matched.length} common technical keywords.`,
      suggestion: 'Paste a job description for a more accurate keyword analysis.',
      matched, missing: []
    };
  }
}

function calculateFormattingScore(resumeText) {
  const resumeLower = resumeText.toLowerCase();
  const maxScore = 20;
  const pointsPerSection = 5;
  let score = 0;
  const found = [];
  const missing = [];

  SECTION_PATTERNS.forEach(section => {
    const hasSection = section.patterns.some(p => resumeLower.includes(p));
    if (hasSection) {
      score += pointsPerSection;
      found.push(section.name);
    } else {
      missing.push(section.name);
    }
  });

  let suggestion = '';
  if (missing.length === 0) suggestion = 'All standard sections present. Your resume structure looks ATS-friendly!';
  else suggestion = `Add these missing sections: ${missing.join(', ')}. ATS systems look for standard headings.`;

  return { score, max: maxScore, details: missing.length === 0 ? 'All standard resume sections detected.' : `Missing sections: ${missing.join(', ')}.`, suggestion, found, missing };
}

function calculateContactScore(resumeText) {
  const maxScore = 15;
  let score = 0;
  const found = [];
  const missing = [];

  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(resumeText)) {
    score += 5; found.push('Email');
  } else { missing.push('Email'); }

  if (/(\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/.test(resumeText)) {
    score += 5; found.push('Phone');
  } else { missing.push('Phone'); }

  const hasLinkedin = /linkedin\.com|linkedin/i.test(resumeText);
  const hasGithub = /github\.com|github/i.test(resumeText);
  if (hasLinkedin || hasGithub) {
    score += 5;
    if (hasLinkedin) found.push('LinkedIn');
    if (hasGithub) found.push('GitHub');
  } else { missing.push('LinkedIn/GitHub profile link'); }

  let suggestion = '';
  if (missing.length === 0) suggestion = 'All essential contact details present!';
  else suggestion = `Add your ${missing.join(', ')} to make it easy for recruiters to reach you.`;

  return { score, max: maxScore, details: found.length > 0 ? `Found: ${found.join(', ')}.` : 'No contact information detected.', suggestion, found, missing };
}

function calculateLengthScore(resumeText) {
  const maxScore = 10;
  const wordCount = resumeText.trim().split(/\s+/).filter(w => w.length > 0).length;

  let score, suggestion;
  if (wordCount < 100) {
    score = 2;
    suggestion = `Very short (${wordCount} words). Aim for 300–700 words for a strong one-page resume.`;
  } else if (wordCount < 200) {
    score = 5;
    suggestion = `Short (${wordCount} words). Add more detail about your experience, projects, and accomplishments.`;
  } else if (wordCount <= 1000) {
    score = 10;
    suggestion = `Excellent length (${wordCount} words). Well within the optimal range for ATS.`;
  } else if (wordCount <= 1300) {
    score = 7;
    suggestion = `Slightly long (${wordCount} words). Consider trimming to under 1000 words.`;
  } else {
    score = 4;
    suggestion = `Too long (${wordCount} words). ATS systems prefer concise resumes — aim for under 1000 words.`;
  }

  return { score, max: maxScore, details: `Word count: ${wordCount}`, suggestion, wordCount };
}

function calculateActionVerbsScore(resumeText) {
  const maxScore = 15;
  const resumeLower = resumeText.toLowerCase();

  const found = ACTION_VERBS.filter(verb => {
    const regex = new RegExp(`\\b${verb}(s|d|ed|ing)?\\b`, 'i');
    return regex.test(resumeLower);
  });

  const ratio = Math.min(found.length / 8, 1);
  const score = Math.round(ratio * maxScore);
  const notFound = ACTION_VERBS.filter(v => !found.includes(v)).slice(0, 6);

  let suggestion;
  if (found.length >= 8) suggestion = `Excellent! Using ${found.length} strong action verbs.`;
  else if (found.length >= 4) suggestion = `Found ${found.length} action verbs. Try adding: "${notFound.slice(0, 3).join('", "')}".`;
  else suggestion = `Only ${found.length} action verbs. Start bullet points with verbs like "${notFound.slice(0, 4).join('", "')}".`;

  return { score, max: maxScore, details: `${found.length} action verbs detected.`, suggestion, found, suggestedVerbs: notFound };
}

function runFullAnalysis(resumeText, jobDescription) {
  const keyword = calculateKeywordScore(resumeText, jobDescription);
  const formatting = calculateFormattingScore(resumeText);
  const contact = calculateContactScore(resumeText);
  const length = calculateLengthScore(resumeText);
  const actionVerbs = calculateActionVerbsScore(resumeText);
  const totalScore = keyword.score + formatting.score + contact.score + length.score + actionVerbs.score;

  return { totalScore, keyword, formatting, contact, length, actionVerbs };
}

// ═══════════════════════════════════════════════════════
// SCORE DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════

function ScoreGauge({ score }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const bgGlow = score >= 75 ? 'rgba(34,197,94,0.15)' : score >= 50 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Needs Work';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="90" cy="90" r={radius} fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black" style={{ color, textShadow: `0 0 30px ${bgGlow}` }}>{score}</span>
          <span className="text-slate-400 text-sm font-medium mt-1">/ 100</span>
        </div>
      </div>
      <span
        className="mt-3 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
        style={{ color, backgroundColor: bgGlow, border: `1px solid ${color}30` }}
      >
        {label}
      </span>
    </div>
  );
}

function CategoryCard({ icon, title, score, max, details, suggestion, children }) {
  const pct = Math.round((score / max) * 100);
  const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const badgeBg = pct >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : pct >= 50 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/80 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeBg}`}>
          {score}/{max}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{details}</p>
      {suggestion && (
        <p className="text-xs text-indigo-300/80 mt-2 leading-relaxed">
          💡 {suggestion}
        </p>
      )}
      {children}
    </div>
  );
}

function KeywordPills({ label, keywords, color }) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400 mb-1.5">{label}:</p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.slice(0, 15).map((kw, i) => (
          <span
            key={i}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
            }`}
          >
            {kw}
          </span>
        ))}
        {keywords.length > 15 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-500">
            +{keywords.length - 15} more
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════

export default function ResumePage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ── PDF TEXT EXTRACTION ──
  const extractTextFromPdf = useCallback(async (file) => {
    setExtractionStatus('Extracting text from PDF...');
    try {
      if (!window.pdfjsLib) {
        throw new Error("PDF library not loaded yet. Please try again in a moment.");
      }
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      setResumeText(fullText.trim());
      setExtractionStatus(`✓ Extracted ${fullText.trim().split(/\s+/).length} words from ${pdf.numPages} page(s)`);
      return fullText.trim();
    } catch (err) {
      console.error('PDF extraction error:', err);
      setExtractionStatus(`⚠ Error extracting text: ${err.message || 'Unknown error'}`);
      return '';
    }
  }, []);

  // ── FILE HANDLING ──
  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setExtractionStatus('⚠ Please upload a valid PDF file.');
      return;
    }
    setPdfFile(file);
    setAtsResult(null);

    // Create blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    setPdfBlobUrl(blobUrl);

    // Extract text
    await extractTextFromPdf(file);
  }, [extractTextFromPdf]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── DRAG & DROP ──
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── ANALYZE ──
  const handleAnalyze = () => {
    if (!resumeText) return;
    setIsAnalyzing(true);
    // Small timeout for visual feedback
    setTimeout(() => {
      try {
        const result = runFullAnalysis(resumeText, jobDescription);
        setAtsResult(result);
      } catch (err) {
        console.error('Error during analysis:', err);
        alert(`Analysis failed: ${err.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);
  };

  // ── RESET ──
  const handleReset = () => {
    setPdfFile(null);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl('');
    setResumeText('');
    setAtsResult(null);
    setExtractionStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" strategy="afterInteractive" />
      <Navbar />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
            📄
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ATS Score Checker
            </h1>
            <p className="text-slate-400 text-sm">Upload your resume PDF and get an instant ATS compatibility score</p>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ═══ LEFT COLUMN: Upload + Preview ═══ */}
          <div className="flex flex-col gap-4">

            {/* Upload Area */}
            {!pdfFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-700 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-200">
                      {isDragging ? 'Drop your PDF here!' : 'Upload Your Resume'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Drag & drop a PDF or <span className="text-indigo-400 font-medium">click to browse</span>
                    </p>
                  </div>
                </div>
                {extractionStatus && (
                  <p className={`text-xs mt-4 font-medium ${extractionStatus.startsWith('⚠') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {extractionStatus}
                  </p>
                )}
              </div>
            ) : (
              /* PDF Preview + Controls */
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
                {/* File info bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">📄</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{pdfFile.name}</p>
                      <p className="text-xs text-slate-400">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    Remove
                  </button>
                </div>

                {extractionStatus && (
                  <div className="px-4 py-2 border-b border-slate-700/30">
                    <p className={`text-xs font-medium ${extractionStatus.startsWith('⚠') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {extractionStatus}
                    </p>
                  </div>
                )}

                {/* PDF iframe preview */}
                {pdfBlobUrl && (
                  <div className="h-[420px] bg-slate-950">
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-full"
                      title="Resume Preview"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Job Description (optional) */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <h3 className="text-sm font-bold text-slate-200">Job Description</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50 font-medium">Optional</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for a more accurate keyword match analysis..."
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 min-h-[120px] resize-none transition-all"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!resumeText || isAnalyzing}
              className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                !resumeText || isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : '🔍  Check ATS Score'}
            </button>
          </div>

          {/* ═══ RIGHT COLUMN: ATS Results ═══ */}
          <div className="flex flex-col gap-4">
            {!atsResult ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/30 min-h-[500px]">
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-800/50 flex items-center justify-center mx-auto mb-5 border border-slate-700/30">
                    <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-base font-medium">Upload your resume to see</p>
                  <p className="text-slate-500 text-sm mt-1">your ATS compatibility score</p>
                </div>
              </div>
            ) : (
              /* Results */
              <>
                {/* Overall Score Card */}
                <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6 text-center">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Overall ATS Score</h2>
                  <ScoreGauge score={atsResult.totalScore} />
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                  <CategoryCard icon="🔑" title="Keyword Match" score={atsResult.keyword.score} max={atsResult.keyword.max} details={atsResult.keyword.details} suggestion={atsResult.keyword.suggestion}>
                    <KeywordPills label="✓ Matched" keywords={atsResult.keyword.matched} color="green" />
                    <KeywordPills label="✗ Missing" keywords={atsResult.keyword.missing} color="red" />
                  </CategoryCard>

                  <CategoryCard icon="📋" title="Formatting & Sections" score={atsResult.formatting.score} max={atsResult.formatting.max} details={atsResult.formatting.details} suggestion={atsResult.formatting.suggestion} />

                  <CategoryCard icon="📧" title="Contact Information" score={atsResult.contact.score} max={atsResult.contact.max} details={atsResult.contact.details} suggestion={atsResult.contact.suggestion} />

                  <CategoryCard icon="📏" title="Resume Length" score={atsResult.length.score} max={atsResult.length.max} details={atsResult.length.details} suggestion={atsResult.length.suggestion} />

                  <CategoryCard icon="⚡" title="Action Verbs" score={atsResult.actionVerbs.score} max={atsResult.actionVerbs.max} details={atsResult.actionVerbs.details} suggestion={atsResult.actionVerbs.suggestion}>
                    <KeywordPills label="✓ Found" keywords={atsResult.actionVerbs.found} color="green" />
                    <KeywordPills label="Try adding" keywords={atsResult.actionVerbs.suggestedVerbs} color="default" />
                  </CategoryCard>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
