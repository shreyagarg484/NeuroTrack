import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, MicOff } from 'lucide-react';

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  label?: string;
  language?: string;
  append?: boolean;
}

export default function VoiceInputButton({
  onTranscript,
  disabled = false,
  label = 'Voice input',
  language = 'en-IN',
}: VoiceInputButtonProps) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const supported = getSpeechRecognitionConstructor() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) return;
    setErrorMessage(null);
    transcriptRef.current = '';
    const recognition = new Constructor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) {
          final += `${alternative.transcript} `;
        } else {
          interim += alternative.transcript;
        }
      }
      if (interim) setStatus('processing');
      if (final) transcriptRef.current += final;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setStatus('error');
      const code = event.error;
      let message = 'Voice recognition failed. Please try again.';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        message = 'Microphone permission denied. Please allow access and retry.';
      } else if (code === 'no-speech') {
        message = 'No speech detected. Please try again.';
      } else if (code === 'audio-capture') {
        message = 'No microphone found. Please check your device.';
      } else if (code === 'network') {
        message = 'Network error during recognition. Please retry.';
      } else if (code === 'aborted') {
        message = 'Recognition was aborted.';
      }
      setErrorMessage(message);
    };

    recognition.onend = () => {
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        onTranscriptRef.current(finalText);
      }
      transcriptRef.current = '';
      recognitionRef.current = null;
      setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setStatus('error');
      setErrorMessage('Could not start voice input. Please retry.');
    }
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (status === 'listening' || status === 'processing') {
      stopListening();
    } else {
      startListening();
    }
  }, [disabled, status, startListening, stopListening]);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
    setStatus('idle');
  }, []);

  if (!supported) {
    return (
      <span className="voice-input-unsupported" role="status">
        Voice input is not supported in this browser. You can still type manually.
      </span>
    );
  }

  const isBusy = status === 'listening' || status === 'processing';

  let icon: React.ReactNode;
  if (status === 'listening') {
    icon = <MicOff size={15} aria-hidden="true" />;
  } else if (status === 'processing') {
    icon = <Loader2 size={15} className="animate-spin" aria-hidden="true" />;
  } else if (status === 'error') {
    icon = <AlertCircle size={15} aria-hidden="true" />;
  } else {
    icon = <Mic size={15} aria-hidden="true" />;
  }

  const title =
    status === 'listening'
      ? 'Listening… click to stop'
      : status === 'processing'
        ? 'Processing speech…'
        : status === 'error'
          ? (errorMessage ?? 'Recognition error')
          : label;

  return (
    <span className="voice-input-wrapper">
      <button
        type="button"
        className={`voice-input-btn voice-${status}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-label={title}
        aria-pressed={isBusy}
        title={title}
      >
        {icon}
      </button>
      {status === 'error' && errorMessage ? (
        <span className="voice-input-error" role="alert">
          {errorMessage}
          <button type="button" className="voice-input-error-dismiss" onClick={handleDismissError} aria-label="Dismiss error">
            ×
          </button>
        </span>
      ) : null}
    </span>
  );
}
