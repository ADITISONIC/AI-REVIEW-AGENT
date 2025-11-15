// src/pages/ReviewPage.tsx

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import {
  Loader2,
  FileText,
  Send,
  Download,
  Trash2,
  Key,
  Sparkles,
  Upload,
} from "lucide-react";

// ✅ Define proper type interfaces
interface Scores {
  novelty: number;
  clarity: number;
  relevance: number;
  technical: number;
  impact: number;
}

interface Justifications {
  novelty: string;
  clarity: string;
  relevance: string;
  technical: string;
  impact: string;
}

interface Improvements {
  novelty: string;
  clarity: string;
  relevance: string;
  technical: string;
  impact: string;
}

interface Recommendation {
  decision: string;
  reasoning: string;
}

interface AIReviews {
  [key: string]: string;
}

interface Review {
  summary: string;
  scores: Scores;
  justifications: Justifications;
  improvements: Improvements;
  recommendation: Recommendation;
  aiReviewSummary: string | null;
  aiCriteriaReviews: AIReviews | null;
}

const ReviewPage: React.FC = () => {
  const [abstract, setAbstract] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("openai_api_key") || "";
    setApiKey(stored);
  }, []);

  // ✅ FILE UPLOAD HANDLING
  // ✅ IMPROVED PDF EXTRACTION WITH TEXT CLEANING
  const extractTextFromPDF = async (file: File): Promise<string> => {
    console.log(
      "Starting PDF extraction for file:",
      file.name,
      "Size:",
      file.size
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Sending PDF to Python backend...");

      const response = await fetch("https://ai-project-backend-fhr3.onrender.com/extract-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.text && data.text.trim().length > 0) {
        console.log("✅ Python backend extraction successful");
        console.log("Abstract length:", data.characters, "characters");
        console.log("Word count:", data.words, "words");

        // Clean and normalize the extracted text
        const cleanedText = cleanExtractedText(data.text);
        console.log(
          "Cleaned text word count:",
          cleanedText.split(/\s+/).length
        );

        return cleanedText;
      } else {
        throw new Error(data.error || "No abstract found in PDF");
      }
    } catch (error: any) {
      console.error("❌ Python backend extraction failed:", error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  };

  // ✅ TEXT CLEANING FUNCTION
  const cleanExtractedText = (text: string): string => {
    if (!text) return "";

    // Remove extra whitespace and normalize
    let cleaned = text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    // Remove common PDF extraction artifacts
    cleaned = cleaned
      .replace(/-\s+/g, "") // Remove hyphenated line breaks
      .replace(/\s+\./g, ".") // Fix space before periods
      .replace(/\s+,/g, ",") // Fix space before commas
      .replace(/\s+;/g, ";") // Fix space before semicolons
      .replace(/\s+:/g, ":") // Fix space before colons
      .replace(/\s+\)/g, ")") // Fix space before closing parentheses
      .replace(/\(\s+/g, "(") // Fix space after opening parentheses
      .replace(/\s+\(/g, "("); // Fix space before opening parentheses

    // Fix common PDF formatting issues
    cleaned = cleaned
      .replace(/([a-z])\.([A-Z])/g, "$1. $2") // Add space after period before capital letter
      .replace(/([.!?])([A-Z])/g, "$1 $2") // Add space after sentence endings
      .replace(/\s+/g, " ") // Final whitespace cleanup
      .trim();

    return cleaned;
  };

  // ✅ ENHANCED FILE UPLOAD HANDLER
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileLoading(true);

    try {
      // Validate file type and size
      const isValidPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const isValidText =
        file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

      if (!isValidPDF && !isValidText) {
        alert("Please upload a PDF or text file only.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("File size too large. Please upload a file smaller than 10MB.");
        return;
      }

      if (file.size === 0) {
        alert("The file appears to be empty. Please select a valid file.");
        return;
      }

      console.log("File validation passed, starting extraction...");

      let extractedText = "";

      if (isValidPDF) {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromFile(file);
      }

      // Log the extracted content for debugging
      console.log("Final extracted text length:", extractedText.length);
      console.log("Final word count:", extractedText.split(/\s+/).length);
      console.log("First 300 chars:", extractedText.substring(0, 300));

      // Use the extracted text directly
      const wordCount = extractedText.split(/\s+/).length;

      console.log("Extraction completed, word count:", wordCount);

      if (wordCount < 30) {
        alert(
          "Very little text was extracted from the document. This might be a scanned PDF or the abstract might not be detectable. Please paste the abstract manually or try a different PDF file."
        );
      } else {
        setAbstract(extractedText);
        console.log(`Abstract set with ${wordCount} words`);
      }
    } catch (error: any) {
      console.error("File processing error:", error);
      alert(
        `Error: ${error.message}. Please try a different PDF file or paste the abstract manually.`
      );
    } finally {
      setFileLoading(false);
      event.target.value = "";
    }
  };

  // ✅ EXTRACT TEXT FROM TEXT FILE
  const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error("Failed to read text file"));
      reader.readAsText(file);
    });
  };

  // ✅ REVIEW LOGIC FROM FIRST CODE
  const evaluateCriteria = (abstract: string): Scores => {
    const wordCount = abstract.split(/\s+/).length;
    const hasStructure = /method|approach|result|conclusion|finding/i.test(
      abstract
    );
    const hasTechnicalTerms =
      /algorithm|framework|model|system|analysis|data/i.test(abstract);
    const hasImpactLanguage =
      /improve|enhance|address|solve|demonstrate|significant/i.test(abstract);

    const noveltyKeywords =
      /novel|new|innovative|first|pioneering|unique|original/i;
    const hasNoveltyIndicators = noveltyKeywords.test(abstract);
    const noveltyScore = hasNoveltyIndicators
      ? wordCount > 150
        ? 4
        : 5
      : hasTechnicalTerms
      ? 3
      : 2;

    const clarityScore =
      hasStructure && wordCount >= 100 && wordCount <= 300
        ? abstract.split(".").length >= 4
          ? 4
          : 3
        : wordCount < 80
        ? 2
        : 3;

    const relevanceKeywords =
      /AI|machine learning|sustainability|healthcare|climate|education|technology/i;
    const relevanceScore = relevanceKeywords.test(abstract)
      ? hasImpactLanguage
        ? 5
        : 4
      : 3;

    const technicalScore =
      hasTechnicalTerms && hasStructure
        ? wordCount > 120
          ? 4
          : 3
        : hasTechnicalTerms
        ? 3
        : 2;

    const impactScore =
      hasImpactLanguage && wordCount > 100
        ? noveltyScore >= 4
          ? 5
          : 4
        : hasImpactLanguage
        ? 3
        : 2;

    return {
      novelty: noveltyScore,
      clarity: clarityScore,
      relevance: relevanceScore,
      technical: technicalScore,
      impact: impactScore,
    };
  };

  const generateJustificationsAndImprovements = (
    scores: Scores,
    abstract: string
  ): {
    justifications: Justifications;
    improvements: Improvements;
  } => {
    const justifications: any = {};
    const improvements: any = {};

    const wordCount = abstract.split(/\s+/).length;
    const sentences = abstract
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const hasNoveltyKeywords =
      /novel|new|innovative|first|pioneering|unique|original/i.test(abstract);
    const hasMethodsDescription =
      /method|approach|algorithm|technique|framework|model|system|using|employ|apply/i.test(
        abstract
      );
    const hasResultsLanguage =
      /result|finding|demonstrate|show|achieve|improve|performance/i.test(
        abstract
      );
    const hasImpactLanguage =
      /improve|enhance|address|solve|significant|enable|transform|benefit/i.test(
        abstract
      );
    const hasTechnicalTerms =
      /algorithm|framework|model|system|analysis|data|computation|optimization/i.test(
        abstract
      );
    const relevanceKeywords =
      /AI|machine learning|sustainability|healthcare|climate|education|technology|deep learning|neural|automated/i.test(
        abstract
      );

    if (scores.novelty >= 4) {
      justifications.novelty = `Your abstract effectively demonstrates originality. The research presents a clear advancement in the field. ${
        hasMethodsDescription
          ? "The innovative methodology you describe sets this work apart."
          : "Your conceptual contribution is clearly articulated."
      } This level of novelty is exactly what conferences seek.`;
      improvements.novelty =
        "To maintain excellence: Continue to explicitly state what makes this work different. Consider adding specific comparisons to position your innovation.";
    } else if (scores.novelty === 3) {
      justifications.novelty = `Your abstract shows potential for originality, but the novelty is not coming through as strongly as it could. ${
        !hasNoveltyKeywords
          ? "You have not used key phrases that signal innovation to reviewers."
          : "The innovation exists but is not sufficiently distinguished from prior work."
      }`;
      improvements.novelty = `Personalized improvements: (1) Add novelty markers like "This is the first study to..." (2) ${
        wordCount < 100
          ? "Expand to 150-200 words for more detail."
          : "Use existing space to state what is different."
      } (3) Replace generic verbs with innovation verbs.`;
    } else {
      justifications.novelty = `Your abstract lacks clear indicators of originality. ${
        !hasNoveltyKeywords ? "There are no explicit novelty statements." : ""
      } ${
        wordCount < 80
          ? "At only " + wordCount + " words, there is insufficient detail."
          : "It reads like an implementation rather than novel contribution."
      }`;
      improvements.novelty = `Critical improvements: (1) Add explicit novelty statements. (2) ${
        wordCount < 100
          ? "Expand from " + wordCount + " to 150+ words."
          : "Dedicate sentences to innovation."
      } (3) State clearly what is unique.`;
    }

    if (scores.clarity >= 4) {
      justifications.clarity = `Your abstract is well-written and easy to follow. ${
        sentenceCount >= 4
          ? "The " + sentenceCount + " sentences provide good structure."
          : "The writing is concise yet complete."
      } ${
        wordCount >= 100 && wordCount <= 300
          ? "Your length (" + wordCount + " words) is optimal."
          : "Your writing is appropriately detailed."
      }`;
      improvements.clarity =
        "Maintaining clarity: Read aloud to catch awkward phrases. Ensure every technical term is necessary.";
    } else if (scores.clarity === 3) {
      justifications.clarity = `Your abstract communicates the basic idea but has clarity issues. ${
        wordCount < 100
          ? "Only " + wordCount + " words - aim for 150+."
          : wordCount > 300
          ? wordCount + " words is too long."
          : ""
      } ${!hasMethodsDescription ? "Missing methodology description." : ""}`;
      improvements.clarity = `Specific fixes: (1) Reorganize into Problem, Method, Results, Impact. (2) ${
        sentenceCount < 4
          ? "Add more sentences (aim for 5-6)."
          : "Improve transitions."
      } (3) Adjust length appropriately.`;
    } else {
      justifications.clarity = `Your abstract has significant clarity problems. ${
        wordCount < 80
          ? "Only " + wordCount + " words."
          : wordCount > 350
          ? wordCount + " words is overwhelming."
          : ""
      } ${!hasMethodsDescription ? "No methodology explanation." : ""}`;
      improvements.clarity =
        "Critical rewrites needed: (1) Follow template structure. (2) Adjust to 150-200 words. (3) Add 5-6 clear sentences. (4) Get peer review.";
    }

    if (scores.relevance >= 4) {
      justifications.relevance = `Your work demonstrates excellent conference fit. ${
        relevanceKeywords
          ? "Your focus aligns perfectly with current priorities."
          : "Clearly relevant to the community."
      }`;
      improvements.relevance =
        "Maintain relevance: Continue connecting to conference themes explicitly.";
    } else if (scores.relevance === 3) {
      justifications.relevance = `Your topic has potential but connection to conference is not clear. ${
        !relevanceKeywords
          ? "Does not mention key themes."
          : "Significance not articulated."
      }`;
      improvements.relevance =
        "Improvements: (1) Add conference alignment statement. (2) Incorporate hot-topic keywords. (3) Explain why this matters.";
    } else {
      justifications.relevance = `Your abstract raises concerns about fit. ${
        !relevanceKeywords
          ? "No recognizable conference keywords."
          : "Relevance unclear."
      }`;
      improvements.relevance =
        "Urgent fixes: (1) Verify conference fit. (2) Add sentences connecting to themes. (3) Use conference keywords explicitly.";
    }

    if (scores.technical >= 4) {
      justifications.technical = `Your abstract demonstrates sound technical approach. ${
        hasMethodsDescription
          ? "You clearly describe methodology."
          : "Technical foundation is evident."
      }`;
      improvements.technical =
        "Maintain strength: Consider adding validation details if space allows.";
    } else if (scores.technical === 3) {
      justifications.technical = `Your abstract suggests reasonable approach but lacks detail. ${
        !hasMethodsDescription
          ? "Reviewers do not understand HOW you did the research."
          : "Methods need more explanation."
      }`;
      improvements.technical =
        "Improvements: (1) Add methodology section. (2) Include technical terms. (3) Add validation details.";
    } else {
      justifications.technical = `Your abstract has serious technical weaknesses. ${
        !hasMethodsDescription
          ? "NO methodology description."
          : "Poorly explained."
      }`;
      improvements.technical =
        "Critical improvements: (1) Add complete methods section. (2) Include technical terminology. (3) Add validation.";
    }

    if (scores.impact >= 4) {
      justifications.impact = `Your work demonstrates strong potential impact. ${
        hasImpactLanguage
          ? "Impact language effectively communicates significance."
          : "Contributions clearly articulated."
      }`;
      improvements.impact =
        "Maximize impact: Continue emphasizing practical significance.";
    } else if (scores.impact === 3) {
      justifications.impact = `Your abstract suggests value but impact is not convincing. ${
        !hasImpactLanguage
          ? "Lacks significance-signaling words."
          : "Not compellingly presented."
      }`;
      improvements.impact =
        "Improvements: (1) Add explicit impact statement. (2) Use impact language. (3) State who benefits.";
    } else {
      justifications.impact = `Your abstract fails to demonstrate impact. ${
        !hasImpactLanguage
          ? "Absolutely no impact language."
          : "Poorly articulated."
      }`;
      improvements.impact =
        "Urgent fixes: (1) Add comprehensive impact section. (2) Answer why this matters. (3) Use strong impact language.";
    }

    return { justifications, improvements };
  };

  const determineRecommendation = (scores: Scores): Recommendation => {
    const avgScore =
      (scores.novelty +
        scores.clarity +
        scores.relevance +
        scores.technical +
        scores.impact) /
      5;

    if (avgScore >= 4.2) {
      return {
        decision: "Accept",
        reasoning:
          "This abstract demonstrates strong quality across all evaluation criteria. The work is well-presented, highly relevant, and shows clear potential for meaningful contribution.",
      };
    } else if (avgScore >= 3.5) {
      return {
        decision: "Borderline",
        reasoning:
          "The abstract shows promise but has areas requiring improvement. Strengthening technical details or clarifying presentation would enhance the submission.",
      };
    } else {
      return {
        decision: "Reject",
        reasoning:
          "The abstract does not meet conference standards in several key areas. Significant revisions would be necessary.",
      };
    }
  };

  const generateAICriteriaReviews = async (
    abstract: string,
    scores: Scores
  ): Promise<AIReviews | null> => {
    if (!apiKey) return null;

    try {
      const wordCount = abstract.split(/\s+/).length;
      const hasNoveltyKeywords =
        /novel|new|innovative|first|pioneering|unique|original/i.test(abstract);
      const hasMethodsDescription =
        /method|approach|algorithm|technique|framework|model|system/i.test(
          abstract
        );
      const relevanceKeywords =
        /AI|machine learning|sustainability|healthcare|climate|education|technology/i.test(
          abstract
        );
      const hasImpactLanguage =
        /improve|enhance|address|solve|significant|enable|transform/i.test(
          abstract
        );
      const hasTechnicalTerms =
        /algorithm|framework|model|system|analysis|data|computation|optimization/i.test(
          abstract
        );

      const criteriaReviews: AIReviews = {};
      const criteriaPrompts = {
        novelty: `Review NOVELTY (2-3 sentences): "${abstract}". Words: ${wordCount}. Has novelty keywords: ${hasNoveltyKeywords}. Score: ${scores.novelty}/5. Be specific about THIS abstract.`,
        clarity: `Review CLARITY (2-3 sentences): "${abstract}". Words: ${wordCount}. Has methods: ${hasMethodsDescription}. Score: ${scores.clarity}/5. Be specific about THIS abstract.`,
        relevance: `Review RELEVANCE (2-3 sentences): "${abstract}". Has keywords: ${relevanceKeywords}. Score: ${scores.relevance}/5. Be specific about THIS abstract.`,
        technical: `Review TECHNICAL (2-3 sentences): "${abstract}". Has methods: ${hasMethodsDescription}. Score: ${scores.technical}/5. Be specific about THIS abstract.`,
        impact: `Review IMPACT (2-3 sentences): "${abstract}". Has impact language: ${hasImpactLanguage}. Score: ${scores.impact}/5. Be specific about THIS abstract.`,
      };

      const promises = Object.entries(criteriaPrompts).map(
        async ([criterion, prompt]) => {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiKey,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an expert reviewer providing specific personalized feedback.",
                  },
                  { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 150,
              }),
            }
          );

          if (!response.ok) throw new Error("API failed");
          const data = await response.json();
          return [criterion, data.choices[0].message.content.trim()];
        }
      );

      const results = await Promise.all(promises);
      results.forEach(([criterion, review]) => {
        criteriaReviews[criterion] = review;
      });

      return criteriaReviews;
    } catch (error) {
      console.error("AI criteria reviews failed:", error);
      return null;
    }
  };

  const generateAIReviewSummary = async (
    abstract: string,
    scores: Scores,
    recommendation: Recommendation
  ): Promise<string | null> => {
    if (!apiKey) return null;

    try {
      const wordCount = abstract.split(/\s+/).length;
      const prompt = `Write brief peer review (3-4 sentences) for: "${abstract}". Words: ${wordCount}. Scores: N${scores.novelty}, C${scores.clarity}, R${scores.relevance}, T${scores.technical}, I${scores.impact}. Decision: ${recommendation.decision}. Be personalized.`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an academic reviewer providing personalized feedback.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 250,
          }),
        }
      );

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("AI summary failed:", error);
      return null;
    }
  };
const generatePaperSummary = async (
  abstract: string
): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `Generate a concise summary (3-4 sentences) of this research paper abstract. Highlight:
    - Main contributions and innovations
    - Methodology used
    - Key results or findings
    
    ABSTRACT: "${abstract.substring(0, 1000)}"
    
    Provide a clear, structured summary that captures the essence of the work.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert academic summarizer. Create concise, informative summaries of research papers.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Paper summarization failed:", error);
    return null;
  }
};

// ========== QUALITY & NOVELTY ENHANCEMENTS ==========
const analyzeMethodologyStrength = (
  abstract: string
): { score: number; feedback: string } => {
  const hasMethodology =
    /method|approach|algorithm|technique|framework|model|system|experiment/i.test(
      abstract
    );
  const hasEvaluation =
    /evaluate|result|finding|performance|accuracy|metric|comparison/i.test(
      abstract
    );
  const hasValidation =
    /validate|verify|test|experiment|case study|dataset/i.test(abstract);

  let score = 3; // Default medium score

  if (hasMethodology && hasEvaluation && hasValidation) score = 5;
  else if (hasMethodology && hasEvaluation) score = 4;
  else if (hasMethodology) score = 3;
  else score = 2;

  const feedback =
    score >= 4
      ? "Strong methodological description with evaluation components."
      : score === 3
      ? "Adequate methodology but could benefit from more evaluation details."
      : "Methodological approach needs more clarity and validation.";

  return { score, feedback };
};

const detectMissingCitations = async (
  abstract: string
): Promise<string[] | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `Analyze this research abstract and suggest 2-3 key papers that should be cited for proper context and comparison. Focus on seminal works or recent important papers in the field.

ABSTRACT: "${abstract.substring(0, 800)}"

Return only the paper titles as a JSON array: ["Paper Title 1", "Paper Title 2", "Paper Title 3"]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert researcher suggesting relevant citations. Return only JSON array.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("Citation analysis failed:", error);
    return null;
  }
};

// ========== LANGUAGE & CLARITY CHECKING ==========
const analyzeLanguageQuality = (
  abstract: string
): { issues: string[]; suggestions: string[] } => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for common issues
  const sentences = abstract.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = abstract.length / (sentences.length || 1);

  if (avgSentenceLength > 150) {
    issues.push("Long, complex sentences may reduce readability");
    suggestions.push("Break long sentences into shorter, clearer statements");
  }

  if (sentences.length < 4) {
    issues.push("Abstract may be too brief for comprehensive understanding");
    suggestions.push(
      "Expand to 4-6 sentences covering problem, method, results, impact"
    );
  }

  const passiveVoice = /(is|are|was|were|be|being|been) [a-z]+ed\b/gi;
  if (passiveVoice.test(abstract)) {
    issues.push("Passive voice usage detected");
    suggestions.push("Use active voice for stronger, clearer statements");
  }

  const jargonCheck = /\b(utilize|leverage|paradigm|synergy|optimize)\b/gi;
  if (jargonCheck.test(abstract)) {
    issues.push("Academic jargon may reduce clarity");
    suggestions.push("Replace jargon with more direct, clear language");
  }

  return { issues, suggestions };
};

// ========== TOPIC CLASSIFICATION & TAGGING ==========
const classifyPaperTopics = async (
  abstract: string
): Promise<{ topics: string[]; confidence: number } | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `Classify this research abstract into 3-5 relevant academic topics or keywords. Focus on:
    - Research methodology (e.g., "deep learning", "statistical analysis")
    - Application domain (e.g., "healthcare", "climate science")
    - Technical focus (e.g., "optimization", "natural language processing")
    
    ABSTRACT: "${abstract.substring(0, 800)}"
    
    Return as JSON: {"topics": ["topic1", "topic2", "topic3"], "confidence": 0.85}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert academic classifier. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("Topic classification failed:", error);
    return null;
  }
};

// ========== PRELIMINARY SCREENING CHECKS ==========
const performPreliminaryChecks = (
  abstract: string
): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];

  const wordCount = abstract.split(/\s+/).length;
  if (wordCount < 100)
    issues.push(
      `Abstract too short (${wordCount} words, minimum 150 recommended)`
    );
  if (wordCount > 350)
    issues.push(
      `Abstract too long (${wordCount} words, maximum 300 recommended)`
    );

  const hasProblemStatement = /problem|challenge|issue|gap|limitation/i.test(
    abstract
  );
  if (!hasProblemStatement)
    issues.push("No clear problem statement identified");

  const hasMethodology = /method|approach|algorithm|technique|framework/i.test(
    abstract
  );
  if (!hasMethodology)
    issues.push("Methodology description missing or unclear");

  const hasResults = /result|finding|outcome|performance|accuracy/i.test(
    abstract
  );
  if (!hasResults) issues.push("Results or findings not clearly stated");

  const hasContribution = /contribution|novel|innovative|advance|improve/i.test(
    abstract
  );
  if (!hasContribution)
    issues.push("Contribution or novelty not clearly articulated");

  return {
    passed: issues.length === 0,
    issues,
  };
};

// ========== ENHANCED REVIEW INTERFACE ==========
interface EnhancedReview {
  paperSummary?: string | null;
  methodologyAnalysis?: { score: number; feedback: string };
  languageAnalysis?: { issues: string[]; suggestions: string[] };
  suggestedCitations?: string[] | null;
  topicClassification?: { topics: string[]; confidence: number } | null;
  preliminaryCheck?: { passed: boolean; issues: string[] };
}
  const analyzeAbstractEnhanced = async (): Promise<void> => {
    if (!abstract.trim()) {
      alert("Please enter an abstract first!");
      return;
    }
    setLoading(true);

    try {
      // ✅ EXISTING CORE LOGIC (Keep your current scoring)
      const scores = evaluateCriteria(abstract);
      const { justifications, improvements } =
        generateJustificationsAndImprovements(scores, abstract);
      const recommendation = determineRecommendation(scores);
      const summary =
        abstract.length > 150 ? abstract.substring(0, 147) + "..." : abstract;

      // ✅ NEW ENHANCED FEATURES
      const enhancedReview: EnhancedReview = {};

      // Automated Summarization
      enhancedReview.paperSummary = await generatePaperSummary(abstract);

      // Quality & Novelty Analysis
      enhancedReview.methodologyAnalysis = analyzeMethodologyStrength(abstract);

      // Language & Clarity Checking
      enhancedReview.languageAnalysis = analyzeLanguageQuality(abstract);

      // Related Work Suggestions
      enhancedReview.suggestedCitations = await detectMissingCitations(
        abstract
      );

      // Topic Classification
      enhancedReview.topicClassification = await classifyPaperTopics(abstract);

      // Preliminary Screening
      enhancedReview.preliminaryCheck = performPreliminaryChecks(abstract);

      // ✅ EXISTING AI FEATURES
      const aiReviewSummary = await generateAIReviewSummary(
        abstract,
        scores,
        recommendation
      );
      const aiCriteriaReviews = await generateAICriteriaReviews(
        abstract,
        scores
      );

      const reviewData: Review & { enhancedReview: EnhancedReview } = {
        summary,
        scores,
        justifications,
        improvements,
        recommendation,
        aiReviewSummary,
        aiCriteriaReviews,
        enhancedReview, // Add enhanced features to review data
      };

      setReview(reviewData);

      // Save to Firebase (your existing code)
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "reviews"), {
          userId: user.uid,
          abstract,
          ...reviewData,
          date: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Enhanced analysis failed:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (): void => {
    if (!review) return;

    let report = "ABSTRACT REVIEW REPORT\n\n";
    report += "SUMMARY:\n" + review.summary + "\n\n";

    if (review.aiReviewSummary) {
      report += "AI REVIEW SUMMARY:\n" + review.aiReviewSummary + "\n\n";
    }

    report += "EVALUATION RESULTS:\n\n";
    Object.entries(review.scores).forEach(([key, score]) => {
      report += `${key.toUpperCase()}: ${score}/5\n`;
      report += `Assessment: ${
        review.justifications[key as keyof Justifications]
      }\n`;
      report += `Improvement: ${
        review.improvements[key as keyof Improvements]
      }\n\n`;
    });

    report += "RECOMMENDATION: " + review.recommendation.decision + "\n";
    report += review.recommendation.reasoning + "\n";

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = (): void => {
    setAbstract("");
    setReview(null);
  };

  const saveApiKey = (): void => {
    localStorage.setItem("openai_api_key", apiKey);
    setShowApiKeyInput(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4) return "text-green-600 bg-green-50";
    if (score >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getDecisionColor = (decision: string): string => {
    if (decision === "Accept")
      return "bg-green-100 text-green-800 border-green-300";
    if (decision === "Borderline")
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="p-6 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                Conference Abstract Review Agent
              </h1>
            </div>

            <p className="text-gray-600 mb-6">
              Submit your research abstract for automated peer-review evaluation
              across five key criteria. Upload a PDF/text file or paste your
              abstract directly.
            </p>

            {!showApiKeyInput ? (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>AI-Enhanced Reviews:</strong> Add your OpenAI API
                    key for personalized GPT-powered feedback on justifications
                    and improvements.
                  </p>
                  <button
                    onClick={() => setShowApiKeyInput(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <Key className="w-4 h-4" />
                    {apiKey ? "Update API Key" : "Add API Key"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                  <button
                    onClick={saveApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Your API key is stored locally and only sent to OpenAI for
                  generating personalized feedback.
                </p>
              </div>
            )}

            {/* ✅ FILE UPLOAD SECTION */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload PDF or Text File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={fileLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {fileLoading ? (
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="text-gray-600 font-medium">
                    {fileLoading
                      ? "Processing file..."
                      : "Click to upload PDF or text file"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Supports .pdf, .txt files • Automatic abstract extraction
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Research Abstract
                </label>
                <span className="text-xs text-gray-500">
                  {abstract.split(/\s+/).filter((w) => w).length} words
                </span>
              </div>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Paste your conference abstract here (100-300 words recommended)..."
                className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition-colors resize-none"
                disabled={loading || fileLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={analyzeAbstractEnhanced}
                disabled={!abstract.trim() || loading || fileLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {loading ? "Analyzing..." : "Review Abstract"}
              </button>

              {review && (
                <>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {review && (
            <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Review Report
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Summary
                  </h3>
                  <p className="text-gray-600 italic">{review.summary}</p>
                </div>
              </div>

              {review.aiReviewSummary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      AI Peer Review Summary
                    </h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {review.aiReviewSummary}
                  </p>
                </div>
              )}
              {(review as any).enhancedReview && (
                <div className="space-y-6">
                  {/* Automated Summarization */}
                  {(review as any).enhancedReview.paperSummary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Paper Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {(review as any).enhancedReview.paperSummary}
                      </p>
                    </div>
                  )}

                  {/* Methodology Analysis */}
                  {(review as any).enhancedReview.methodologyAnalysis && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        🔬 Methodology Analysis
                      </h3>
                      <p className="text-gray-700 mb-2">
                        <strong>Score:</strong>{" "}
                        {
                          (review as any).enhancedReview.methodologyAnalysis
                            .score
                        }
                        /5
                      </p>
                      <p className="text-gray-700">
                        {
                          (review as any).enhancedReview.methodologyAnalysis
                            .feedback
                        }
                      </p>
                    </div>
                  )}

                  {/* Language Quality */}
                  {(review as any).enhancedReview.languageAnalysis && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        ✍️ Language Quality
                      </h3>
                      {(review as any).enhancedReview.languageAnalysis.issues
                        .length > 0 ? (
                        <div>
                          <p className="text-red-600 font-semibold mb-2">
                            Issues Found:
                          </p>
                          <ul className="list-disc list-inside text-gray-700 mb-3">
                            {(
                              review as any
                            ).enhancedReview.languageAnalysis.issues.map(
                              (issue: string, index: number) => (
                                <li key={index}>{issue}</li>
                              )
                            )}
                          </ul>
                          <p className="text-green-600 font-semibold mb-2">
                            Suggestions:
                          </p>
                          <ul className="list-disc list-inside text-gray-700">
                            {(
                              review as any
                            ).enhancedReview.languageAnalysis.suggestions.map(
                              (suggestion: string, index: number) => (
                                <li key={index}>{suggestion}</li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-green-600 font-semibold">
                          ✓ Good language quality and clarity
                        </p>
                      )}
                    </div>
                  )}

                  {/* Suggested Citations */}
                  {(review as any).enhancedReview.suggestedCitations && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        📚 Suggested References
                      </h3>
                      <ul className="list-disc list-inside text-gray-700">
                        {(review as any).enhancedReview.suggestedCitations.map(
                          (citation: string, index: number) => (
                            <li key={index}>{citation}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Topic Classification */}
                  {(review as any).enhancedReview.topicClassification && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        🏷️ Topic Classification
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(
                          review as any
                        ).enhancedReview.topicClassification.topics.map(
                          (topic: string, index: number) => (
                            <span
                              key={index}
                              className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                            >
                              {topic}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">
                        Confidence:{" "}
                        {(
                          (review as any).enhancedReview.topicClassification
                            .confidence * 100
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                  )}

                  {/* Preliminary Screening */}
                  {(review as any).enhancedReview.preliminaryCheck && (
                    <div
                      className={`border rounded-lg p-5 ${
                        (review as any).enhancedReview.preliminaryCheck.passed
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        ✅ Preliminary Screening
                      </h3>
                      {(review as any).enhancedReview.preliminaryCheck
                        .passed ? (
                        <p className="text-green-600 font-semibold">
                          ✓ Passes all preliminary checks
                        </p>
                      ) : (
                        <div>
                          <p className="text-red-600 font-semibold mb-2">
                            Issues Found:
                          </p>
                          <ul className="list-disc list-inside text-gray-700">
                            {(
                              review as any
                            ).enhancedReview.preliminaryCheck.issues.map(
                              (issue: string, index: number) => (
                                <li key={index}>{issue}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-6">
                {[
                  { key: "novelty", label: "Novelty", icon: "🧠" },
                  { key: "clarity", label: "Clarity", icon: "✍️" },
                  { key: "relevance", label: "Relevance", icon: "🎯" },
                  { key: "technical", label: "Technical Quality", icon: "⚙️" },
                  { key: "impact", label: "Impact", icon: "🌍" },
                ].map(({ key, label, icon }) => (
                  <div
                    key={key}
                    className="border rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span>{icon}</span>
                        {label}
                      </h3>
                      <span
                        className={
                          "px-4 py-2 rounded-full font-bold text-lg " +
                          getScoreColor(review.scores[key as keyof Scores])
                        }
                      >
                        {review.scores[key as keyof Scores]}/5
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Assessment
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {review.justifications[key as keyof Justifications]}
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          💡 How to Improve
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {review.improvements[key as keyof Improvements]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={
                  "border-2 rounded-lg p-6 " +
                  getDecisionColor(review.recommendation.decision)
                }
              >
                <h3 className="text-xl font-bold mb-3">
                  Overall Recommendation
                </h3>
                <div className="mb-3">
                  <span className="inline-block px-4 py-2 rounded-full font-bold text-lg bg-white bg-opacity-50">
                    {review.recommendation.decision.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {review.recommendation.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
