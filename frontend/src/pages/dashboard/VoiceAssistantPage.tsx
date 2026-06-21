import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceStore } from '@/stores/voice.store';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { toast } from '@/components/ui/toaster';

// Audio wave bars
function AudioWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1 h-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary"
          animate={active ? {
            height: [8, Math.random() * 40 + 8, 8],
          } : { height: 8 }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Pulsing mic ring
function MicRing({ status }: { status: string }) {
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking';

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer rings */}
      {isListening && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-primary/30"
              initial={{ width: 120, height: 120, opacity: 0.8 }}
              animate={{ width: 120 + i * 30, height: 120 + i * 30, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {/* Main circle */}
      <motion.div
        className={`w-28 h-28 rounded-full flex items-center justify-center ${
          isListening ? 'bg-gradient-to-br from-red-500 to-rose-600 glow-primary' :
          isThinking ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
          isSpeaking ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
          'bg-gradient-to-br from-violet-500 to-indigo-600 glow-primary'
        }`}
        animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {isListening ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
      </motion.div>
    </div>
  );
}

export default function VoiceAssistantPage() {
  const { status, transcript, response, setStatus, setTranscript, setResponse, reset } = useVoiceStore();
  const [isMuted, setIsMuted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef(connectSocket());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connected', () => {});
    socket.on('voice:transcript', ({ text }: { text: string }) => setTranscript(text));
    socket.on('voice:thinking', ({ status: s }: { status: boolean }) => s && setStatus('thinking'));
    socket.on('voice:response', ({ text }: { text: string }) => {
      setResponse(text);
      setStatus('speaking');
    });
    socket.on('voice:audio_response', ({ audio }: { audio: ArrayBuffer }) => {
      if (isMuted) { setStatus('idle'); return; }
      const blob = new Blob([audio], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.play();
      audioRef.current.onended = () => { setStatus('idle'); URL.revokeObjectURL(url); };
    });
    socket.on('voice:error', ({ message }: { message: string }) => {
      toast.error(message);
      setStatus('idle');
    });

    return () => {
      socket.off('voice:transcript');
      socket.off('voice:thinking');
      socket.off('voice:response');
      socket.off('voice:audio_response');
      socket.off('voice:error');
    };
  }, [isMuted, setStatus, setTranscript, setResponse]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blob.arrayBuffer().then((buffer) => {
          socketRef.current.emit('voice:audio', { buffer });
        });
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setStatus('listening');
      reset();
    } catch {
      toast.error('Microphone access denied');
    }
  }, [setStatus, reset]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('thinking');
    }
  }, [setStatus]);

  const handleToggle = () => {
    if (status === 'idle') startListening();
    else if (status === 'listening') stopListening();
    else if (status === 'speaking') {
      audioRef.current?.pause();
      setStatus('idle');
    }
  };

  const statusLabel = {
    idle: 'Tap to speak',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
  }[status];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-gradient">AVA Voice</h1>
        </div>
        <p className="text-sm text-muted-foreground">Real-time AI voice assistant</p>
      </motion.div>

      {/* Mic + waves */}
      <div className="flex flex-col items-center gap-6">
        <MicRing status={status} />
        <AudioWave active={status === 'listening' || status === 'speaking'} />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{statusLabel}</p>
      </div>

      {/* Main button */}
      <Button
        onClick={handleToggle}
        variant={status === 'listening' ? 'destructive' : 'gradient'}
        size="xl"
        className="rounded-2xl px-12"
        disabled={status === 'thinking'}
      >
        {status === 'idle' ? <><Mic className="w-5 h-5 mr-2" /> Start Speaking</> :
         status === 'listening' ? <><MicOff className="w-5 h-5 mr-2" /> Stop</> :
         status === 'thinking' ? 'Thinking…' :
         <><Volume2 className="w-5 h-5 mr-2" /> Stop Playback</>}
      </Button>

      {/* Transcript / Response */}
      <AnimatePresence mode="wait">
        {(transcript || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xl space-y-3"
          >
            {transcript && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">You</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
            {response && (
              <div className="glass rounded-2xl p-4 border border-primary/20">
                <p className="text-xs text-primary mb-1 font-medium uppercase tracking-wider">AVA</p>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-xl glass">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} className="rounded-xl glass">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
