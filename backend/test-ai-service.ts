
import AIRankingService from './src/services/AIRankingService';
import { IKnowledgePoint } from './src/models/Post'; // Assuming this is where IKnowledgePoint is exported

async function runTest() {
  console.log('--- Starting AI Service Test ---');
  
  // 1. Test analyzeQuestion
  const testQuestions = [
    "What is 2 + 2?",
    "Can you explain the theory of relativity and its impact on modern physics?",
    "How do I solve a quadratic equation like x^2 + 5x + 6 = 0?",
    "What is a verb?",
    "Discuss the geopolitical implications of the Cold War."
  ];

  for (const question of testQuestions) {
    console.log(`\nAnalyzing: "${question}"`);
    try {
      const result = await AIRankingService.analyzeQuestion(question);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // 2. Test generateKnowledgeSummary
  console.log('\n--- Testing generateKnowledgeSummary ---');
  
  const mockKnowledgePoints: IKnowledgePoint[] = [
    { topic: 'Mathematics', subtopic: 'Algebra', concept: 'Quadratic Equations' },
    { topic: 'Physics', subtopic: 'Mechanics', concept: 'Newton\'s Laws' },
    { topic: 'Mathematics', subtopic: 'Calculus', concept: 'Derivatives' },
    { topic: 'Mathematics', subtopic: 'Algebra', concept: 'Linear Equations' },
    { topic: 'Physics', subtopic: 'Thermodynamics', concept: 'Entropy' }
  ];

  console.log('Input Knowledge Points:', JSON.stringify(mockKnowledgePoints, null, 2));

  try {
    const summary = await AIRankingService.generateKnowledgeSummary(mockKnowledgePoints);
    console.log('\nGenerated Summary:\n');
    console.log(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
  }

  console.log('\n--- Test Complete ---');
}

runTest();
