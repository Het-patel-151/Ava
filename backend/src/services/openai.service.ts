/**
 * Re-exports from ai.service.ts for backward compatibility.
 * All AI is now powered by Ollama (free, local) instead of OpenAI.
 */
export {
  streamChatCompletion,
  transcribeAudio,
  synthesizeSpeech,
  analyzeDocument,
  ollamaClient as openai,
} from './ai.service';
