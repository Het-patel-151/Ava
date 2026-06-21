/**
 * AI Service — 100% FREE using Ollama (local LLM)
 * Ollama is OpenAI-API compatible, so the same interface works.
 * Models run entirely on your machine — no API keys, no cost.
 */
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Ollama exposes an OpenAI-compatible REST API at port 11434
export const ollamaClient = new OpenAI({
  apiKey: 'ollama',           // any non-empty string — Ollama ignores it
  baseURL: process.env.OLLAMA_BASE_URL || 'http://ollama:11434/v1',
});

// Default model — pulled automatically in docker-compose
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ─── Chat / Streaming ────────────────────────────────────────────────────────

export const streamChatCompletion = async (
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  model: string = DEFAULT_MODEL
): Promise<string> => {
  // Map OpenAI model names to Ollama equivalents
  const ollamaModel = mapModel(model);

  const stream = await ollamaClient.chat.completions.create({
    model: ollamaModel,
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

// ─── Speech-to-Text (Whisper via Ollama) ─────────────────────────────────────

export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  try {
    // Try Ollama's Whisper endpoint first
    const ollamaWhisperUrl = `${process.env.OLLAMA_BASE_URL || 'http://ollama:11434'}/api/transcribe`;
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFilePath));
    form.append('model', 'whisper');

    const res = await fetch(ollamaWhisperUrl, { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json() as { text?: string };
      return data.text || '';
    }
  } catch {
    // Fall through to browser Web Speech API (handled on frontend)
  }

  // Fallback: use faster-whisper HTTP service if running
  try {
    const whisperUrl = process.env.WHISPER_URL || 'http://whisper:9000';
    const form = new FormData();
    form.append('audio_file', fs.createReadStream(audioFilePath));

    const res = await fetch(`${whisperUrl}/asr?task=transcribe&language=en&output=txt`, {
      method: 'POST',
      body: form,
    });
    if (res.ok) return (await res.text()).trim();
  } catch {
    logger.warn('Whisper service unavailable, returning empty transcript');
  }

  return '';
};

// ─── Text-to-Speech (Piper TTS — free, local) ────────────────────────────────

export const synthesizeSpeech = async (
  text: string,
  _voice: string = 'default'
): Promise<Buffer> => {
  try {
    // Piper TTS — ultra-fast local neural TTS, completely free
    const piperUrl = process.env.PIPER_URL || 'http://piper:5000';
    const res = await fetch(`${piperUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const buf = await res.buffer();
      return buf;
    }
  } catch {
    logger.warn('Piper TTS unavailable, returning empty audio');
  }

  // Return silent WAV if TTS unavailable (frontend shows text instead)
  return Buffer.alloc(0);
};

// ─── Document Analysis ───────────────────────────────────────────────────────

export const analyzeDocument = async (
  fileId: string,
  filePath: string,
  mimeType: string
): Promise<void> => {
  try {
    let content = '';
    if (mimeType.startsWith('text/')) {
      content = fs.readFileSync(filePath, 'utf-8').slice(0, 4000);
    } else {
      content = `File uploaded: ${filePath} (${mimeType})`;
    }

    const response = await ollamaClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{
        role: 'user',
        content: `Provide a concise 2-3 paragraph summary of this document:\n\n${content}`,
      }],
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content || '';
    await prisma.uploadedFile.update({ where: { id: fileId }, data: { summary, isProcessed: true } });
  } catch (err) {
    logger.error('Document analysis failed:', err);
    await prisma.uploadedFile.update({ where: { id: fileId }, data: { isProcessed: false } });
  }
};

// ─── Model name mapping ───────────────────────────────────────────────────────

function mapModel(openaiModel: string): string {
  const map: Record<string, string> = {
    'gpt-4o':       process.env.OLLAMA_MODEL || 'llama3.2',
    'gpt-4o-mini':  process.env.OLLAMA_MODEL_FAST || 'llama3.2',
    'gpt-4-turbo':  process.env.OLLAMA_MODEL || 'llama3.2',
  };
  return map[openaiModel] || openaiModel;
}
