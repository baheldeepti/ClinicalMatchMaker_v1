import {
  createElevenLabsClient,
  synthesizeSpeech,
  getVoiceForLanguage,
} from '../../lib/elevenlabs';
import type {
  AdvocateInput,
  VoiceScript,
  MatchResult,
} from '../../lib/schemas';

// ============================================================================
// Constants
// ============================================================================

const REQUIRED_DISCLAIMER =
  'This information is for educational purposes only and should not replace professional medical advice. ' +
  'Please discuss these options with your healthcare provider before making any decisions about clinical trial participation.';

const LANGUAGE_GREETINGS: Record<string, string> = {
  en: 'Hello',
  es: 'Hola',
  zh: '你好',
  fr: 'Bonjour',
  de: 'Guten Tag',
};

// ============================================================================
// Script Templates
// ============================================================================

function getStrongMatchTemplate(
  topMatches: MatchResult[],
  language: string
): string {
  const greeting = LANGUAGE_GREETINGS[language] || 'Hello';
  const match = topMatches[0];

  return `${greeting}. I've found some promising clinical trial options that could be a good fit for you.

The top match is a trial that scores ${match.score} out of 100. ${match.summary}

${topMatches.length > 1 ? `I also found ${topMatches.length - 1} other strong matches worth discussing with your doctor.` : ''}

Here's what I recommend as next steps: First, print or save these results. Then, schedule a conversation with your oncologist or care team to review these options together. They can help determine which trial, if any, might be right for your specific situation.

Remember: ${REQUIRED_DISCLAIMER}`;
}

function getPossibleMatchTemplate(
  matches: MatchResult[],
  language: string
): string {
  const greeting = LANGUAGE_GREETINGS[language] || 'Hello';

  return `${greeting}. I've reviewed available clinical trials and found some possible options worth exploring.

I found ${matches.length} trials that could potentially be a fit for you. While they're not perfect matches, they're worth discussing with your doctor. Some details about your medical history would need to be confirmed to determine final eligibility.

Your next step is to share these results with your healthcare team. They know your complete medical history and can help identify which trials, if any, make sense to pursue.

${REQUIRED_DISCLAIMER}`;
}

function getNoStrongMatchTemplate(language: string): string {
  const greeting = LANGUAGE_GREETINGS[language] || 'Hello';

  return `${greeting}. I've searched through available clinical trials, and while I didn't find a strong match right now, please don't be discouraged.

Clinical trials are constantly opening and closing, and new options become available regularly. Your situation may also change over time, which could open up new possibilities.

Here's what you can do: Talk to your doctor about other treatment options available to you. You might also consider checking back in a few months, as new trials often open up.

Stay hopeful, and remember that you have a healthcare team supporting you through this journey.

${REQUIRED_DISCLAIMER}`;
}

// ============================================================================
// Script Generation
// ============================================================================

/**
 * Generate script from templates
 */
function generateScriptFromTemplate(
  matchResults: MatchResult[],
  language: string
): string {
  const strongMatches = matchResults.filter((m) => m.category === 'strong_match');
  const possibleMatches = matchResults.filter((m) => m.category === 'possible_match');

  if (strongMatches.length > 0) {
    return getStrongMatchTemplate(strongMatches, language);
  }

  if (possibleMatches.length > 0) {
    return getPossibleMatchTemplate(possibleMatches, language);
  }

  return getNoStrongMatchTemplate(language);
}

// ============================================================================
// Main Agent Function
// ============================================================================

// Enable audio synthesis with ElevenLabs
const SKIP_AUDIO_SYNTHESIS = false;

/**
 * Run the Patient Advocate agent
 * Generates compassionate voice scripts and synthesizes audio
 */
export async function runAdvocateAgent(input: AdvocateInput): Promise<VoiceScript> {
  const { matchResults, language = 'en' } = input;

  console.log('Generating patient advocate script...');

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate script text from template
  let scriptText = generateScriptFromTemplate(matchResults, language);

  // Ensure disclaimer is included
  if (!scriptText.includes('educational purposes only')) {
    scriptText += `\n\n${REQUIRED_DISCLAIMER}`;
  }

  // Skip audio synthesis in development
  if (SKIP_AUDIO_SYNTHESIS) {
    return {
      text: scriptText,
      audioUrl: '', // No audio in development
      duration: estimateDuration(scriptText),
      language,
    };
  }

  // Synthesize audio
  try {
    const elevenLabsClient = createElevenLabsClient();
    const audioResult = await synthesizeSpeech(elevenLabsClient, scriptText, {
      language: language as 'en' | 'es' | 'zh' | 'fr' | 'de',
      voiceId: getVoiceForLanguage(language),
      stability: 0.5,
      similarityBoost: 0.75,
    });

    return {
      text: scriptText,
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      language,
    };
  } catch (audioError) {
    console.error('Audio synthesis failed:', audioError);

    // Return script without audio
    return {
      text: scriptText,
      audioUrl: '',
      duration: estimateDuration(scriptText),
      language,
    };
  }
}

/**
 * Estimate spoken duration from text
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.round((wordCount / 150) * 60); // ~150 words per minute
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate that script meets requirements
 */
export function validateScript(script: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check word count
  const wordCount = script.split(/\s+/).length;
  if (wordCount < 100) {
    issues.push('Script too short (< 100 words)');
  }
  if (wordCount > 300) {
    issues.push('Script too long (> 300 words)');
  }

  // Check for disclaimer
  if (!script.includes('educational purposes')) {
    issues.push('Missing required disclaimer');
  }

  // Check reading level (basic Flesch-Kincaid approximation)
  const sentences = script.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / sentences.length;
  if (avgWordsPerSentence > 25) {
    issues.push('Sentences too complex for 8th-grade reading level');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
