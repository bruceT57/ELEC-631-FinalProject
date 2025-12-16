import axios from 'axios';
import config from '../config/config';
import { DifficultyLevel, IKnowledgePoint } from '../models';

/**
 * AI Analysis result interface
 */
export interface IAIAnalysisResult {
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  knowledgePoints: IKnowledgePoint[];
  reasoning: string;
<<<<<<< HEAD
=======
  hint: string;
  keyConceptsDefinitions: { term: string; definition: string }[];
>>>>>>> ai_feature_clean
}

/**
 * AI Ranking Service class using OpenAI API
 */
class AIRankingService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = config.openaiApiKey;
  }

  /**
   * Analyze question difficulty and extract knowledge points
   */
  public async analyzeQuestion(question: string): Promise<IAIAnalysisResult> {
    if (!this.apiKey) {
      // Return default values if API key not configured
      console.warn('OpenAI API key not configured, using default ranking');
<<<<<<< HEAD
      return this.getDefaultAnalysis();
=======
      return this.getDefaultAnalysis(question);
>>>>>>> ai_feature_clean
    }

    try {
      const prompt = this.buildAnalysisPrompt(question);

      const response = await axios.post(
        this.apiUrl,
        {
<<<<<<< HEAD
          model: 'gpt-3.5-turbo',
=======
          model: 'gpt-4o-mini',
>>>>>>> ai_feature_clean
          messages: [
            {
              role: 'system',
              content:
                'You are an educational AI assistant that analyzes student questions to determine difficulty level and extract knowledge points. Respond ONLY with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      const content = response.data.choices[0].message.content;
<<<<<<< HEAD
      const result = JSON.parse(content);
=======
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      let result;
      try {
        result = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw parseError;
      }
      
      console.log("use GPT to analyze the question and return the difficulty level and difficulty score");
      console.log(result);
>>>>>>> ai_feature_clean

      return this.normalizeAnalysisResult(result);
    } catch (error: any) {
      console.error('AI analysis error:', error.message);
<<<<<<< HEAD
      return this.getDefaultAnalysis();
=======
      return this.getDefaultAnalysis(question);
>>>>>>> ai_feature_clean
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(question: string): string {
    return `Analyze the following student question and provide:
1. Difficulty level (easy, medium, hard, very_hard)
2. Difficulty score (0-100, where 0 is easiest and 100 is hardest)
3. Knowledge points (topic, subtopic, concept)
4. Brief reasoning for the difficulty assessment
<<<<<<< HEAD
=======
5. A short, conceptual hint or overview for the tutor (max 50 words).
6. Definitions of 1-3 key concepts found in the question (e.g. "Chain Rule", "Derivative").
>>>>>>> ai_feature_clean

Question: "${question}"

Respond in this exact JSON format:
{
  "difficultyLevel": "medium",
  "difficultyScore": 50,
  "knowledgePoints": [
<<<<<<< HEAD
    {
      "topic": "Mathematics",
      "subtopic": "Algebra",
      "concept": "Quadratic equations"
    }
  ],
  "reasoning": "This question requires understanding of..."
=======
    { "topic": "Math", "subtopic": "Algebra", "concept": "Quadratic" }
  ],
  "reasoning": "...",
  "hint": "...",
  "keyConceptsDefinitions": [
    { "term": "Quadratic Formula", "definition": "A formula used to solve quadratic equations: x = (-b ± √(b² - 4ac)) / 2a." }
  ]
>>>>>>> ai_feature_clean
}`;
  }

  /**
   * Normalize AI result to match interface
   */
  private normalizeAnalysisResult(result: any): IAIAnalysisResult {
    const difficultyScore = Math.min(100, Math.max(0, result.difficultyScore || 50));

    let difficultyLevel: DifficultyLevel;
    if (difficultyScore < 25) {
      difficultyLevel = DifficultyLevel.EASY;
    } else if (difficultyScore < 50) {
      difficultyLevel = DifficultyLevel.MEDIUM;
    } else if (difficultyScore < 75) {
      difficultyLevel = DifficultyLevel.HARD;
    } else {
      difficultyLevel = DifficultyLevel.VERY_HARD;
    }

    return {
      difficultyLevel: result.difficultyLevel || difficultyLevel,
      difficultyScore,
      knowledgePoints: result.knowledgePoints || [],
<<<<<<< HEAD
      reasoning: result.reasoning || 'Analysis completed'
=======
      reasoning: result.reasoning || 'Analysis completed',
      hint: result.hint || 'No hint available.',
      keyConceptsDefinitions: result.keyConceptsDefinitions || []
>>>>>>> ai_feature_clean
    };
  }

  /**
   * Get default analysis when AI is unavailable
<<<<<<< HEAD
   */
  private getDefaultAnalysis(): IAIAnalysisResult {
    return {
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficultyScore: 50,
      knowledgePoints: [],
      reasoning: 'Default ranking (AI service unavailable)'
=======
   * Generates pseudo-random data based on question length/content for testing
   */
  private getDefaultAnalysis(question: string): IAIAnalysisResult {
    // Simple heuristic for testing: longer questions might be harder
    const lengthScore = Math.min(100, question.length / 2);
    // Add some randomness
    const randomFactor = Math.random() * 20 - 10; 
    const difficultyScore = Math.max(0, Math.min(100, Math.round(lengthScore + randomFactor)));

    let difficultyLevel: DifficultyLevel;
    if (difficultyScore < 30) {
      difficultyLevel = DifficultyLevel.EASY;
    } else if (difficultyScore < 60) {
      difficultyLevel = DifficultyLevel.MEDIUM;
    } else if (difficultyScore < 85) {
      difficultyLevel = DifficultyLevel.HARD;
    } else {
      difficultyLevel = DifficultyLevel.VERY_HARD;
    }

    // Extract some fake knowledge points based on keywords
    const knowledgePoints: IKnowledgePoint[] = [];
    const keywords = ['algebra', 'geometry', 'calculus', 'physics', 'chemistry', 'history', 'grammar'];
    const questionLower = question.toLowerCase();
    
    const foundTopic = keywords.find(k => questionLower.includes(k)) || 'General';
    
    knowledgePoints.push({
      topic: foundTopic.charAt(0).toUpperCase() + foundTopic.slice(1),
      subtopic: 'Basic Concepts',
      concept: 'Fundamental understanding'
    });

    return {
      difficultyLevel,
      difficultyScore,
      knowledgePoints,
      reasoning: `Default ranking (AI unavailable). Score calculated based on text length (${question.length} chars).`,
      hint: 'Default Hint: This question appears to be about basic concepts. (AI unavailable)',
      keyConceptsDefinitions: []
>>>>>>> ai_feature_clean
    };
  }

  /**
   * Batch analyze multiple questions
   */
  public async batchAnalyzeQuestions(
    questions: string[]
  ): Promise<IAIAnalysisResult[]> {
    const analyses = await Promise.all(
      questions.map((question) => this.analyzeQuestion(question))
    );
    return analyses;
  }

  /**
   * Generate knowledge summary for tutor
   */
  public async generateKnowledgeSummary(
    knowledgePoints: IKnowledgePoint[]
  ): Promise<string> {
    if (knowledgePoints.length === 0) {
      return 'No knowledge points identified yet.';
    }

    const topicMap = new Map<string, Set<string>>();

    knowledgePoints.forEach((kp) => {
      if (!topicMap.has(kp.topic)) {
        topicMap.set(kp.topic, new Set());
      }
      topicMap.get(kp.topic)!.add(kp.concept);
    });

    const summary: string[] = [];
    topicMap.forEach((concepts, topic) => {
      summary.push(`**${topic}**: ${Array.from(concepts).join(', ')}`);
    });

    return summary.join('\n');
  }
<<<<<<< HEAD
=======

  /**
   * Generate comprehensive session summary
   */
  public async generateSessionSummary(posts: any[]): Promise<string> {
    if (!this.apiKey || posts.length === 0) {
      return 'No summary available (insufficient data or missing API key).';
    }

    try {
      // Prepare data for AI
      const questionsData = posts.map(p => ({
        question: p.question,
        difficulty: p.difficultyLevel,
        topics: p.knowledgePoints.map((kp: any) => kp.concept).join(', ')
      })).slice(0, 50); // Limit to last 50 questions to avoid token limits

      const prompt = `Analyze these student questions from a tutoring session and generate a structured summary report for the tutor/PAL leader.

Session Data (${questionsData.length} questions):
${JSON.stringify(questionsData, null, 2)}

Please provide a report in Markdown format with the following sections:
1. **Main Topics Discussed**: Key themes and concepts covered.
2. **Common Difficulties**: Concepts that students found most challenging (based on difficulty levels and question types).
3. **Suggested Review Points**: What the tutor should review or clarify in the next session.
4. **Engagement Overview**: Brief comment on the variety/depth of questions.

Keep it concise and actionable.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational analyst creating a session summary for a tutor.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Session summary generation error:', error.message);
      return 'Failed to generate session summary due to an AI service error.';
    }
  }
>>>>>>> ai_feature_clean
}

export default new AIRankingService();
