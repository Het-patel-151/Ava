import OpenAI from 'openai';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import fs from 'fs';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const streamChatCompletion = async (
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  model: string = 'gpt-4o'
): Promise<string> => {
  const stream = await openai.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 2048,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
};

export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    response_format: 'text',
  });
  return transcription as unknown as string;
};

export const synthesizeSpeech = async (
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
): Promise<Buffer> => {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
  });
  return Buffer.from(await mp3.arrayBuffer());
};

export const analyzeDocument = async (fileId: string, filePath: string, mimeType: string): Promise<void> => {
  try {
    let content = '';

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      content = fs.readFileSync(filePath, 'utf-8');
    } else {
      // For PDFs and other types, use a placeholder
      content = `File content analysis for ${filePath}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Provide a concise summary (2-3 paragraphs) of this document:\n\n${content.slice(0, 4000)}`,
        },
      ],
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content || '';
    await prisma.uploadedFile.update({ where: { id: fileId }, data: { summary, isProcessed: true } });
  } catch (err) {
    logger.error('Document analysis failed:', err);
    await prisma.uploadedFile.update({ where: { id: fileId }, data: { isProcessed: false } });
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
};
