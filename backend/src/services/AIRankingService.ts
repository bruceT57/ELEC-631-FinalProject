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
      return this.getDefaultAnalysis();
    }

    try {
      const prompt = this.buildAnalysisPrompt(question);

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
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
      const result = JSON.parse(content);

      return this.normalizeAnalysisResult(result);
    } catch (error: any) {
      console.error('AI analysis error:', error.message);
      return this.getDefaultAnalysis();
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

Question: "${question}"

Respond in this exact JSON format:
{
  "difficultyLevel": "medium",
  "difficultyScore": 50,
  "knowledgePoints": [
    {
      "topic": "Mathematics",
      "subtopic": "Algebra",
      "concept": "Quadratic equations"
    }
  ],
  "reasoning": "This question requires understanding of..."
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
      reasoning: result.reasoning || 'Analysis completed'
    };
  }

  /**
   * Get default analysis when AI is unavailable
   */
  private getDefaultAnalysis(): IAIAnalysisResult {
    return {
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficultyScore: 50,
      knowledgePoints: [],
      reasoning: 'Default ranking (AI service unavailable)'
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
}

export default new AIRankingService();
