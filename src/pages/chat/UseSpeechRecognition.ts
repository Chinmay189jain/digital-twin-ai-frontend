import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// Extend the global window interface for Speech Recognition API
declare global {
    interface Window {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
    }
}

// Define the structure of the SpeechRecognition instance
type SpeechRecognitionType = {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((this: SpeechRecognitionType, ev: any) => any) | null;
    onend: ((this: SpeechRecognitionType, ev: any) => any) | null;
    onerror: ((this: SpeechRecognitionType, ev: any) => any) | null;
};

// Custom hook for handling Speech-to-Text using the Web Speech API.
export function UseSpeechRecognition(language: string = 'en-IN') {
    // State variables to track mic status, browser support, and interim speech
    const [isListening, setIsListening] = useState(false);
    const [supportsSTT, setSupportsSTT] = useState(false);
    const [interimText, setInterimText] = useState('');

    // Ref to store the SpeechRecognition instance
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    // Ref to store the callback function from the parent component
    const onFinalTranscript = useRef<(text: string) => void>(() => { });

    // Initialize the Web Speech API once on mount
    useEffect(() => {
        const SR = typeof window !== 'undefined'
            ? (window.SpeechRecognition || window.webkitSpeechRecognition)
            : null;

        if (!SR) {
            // If not supported, update state and exit
            setSupportsSTT(false);
            return;
        }
        setSupportsSTT(true);

        // Create new instance of SpeechRecognition
        const rec: SpeechRecognitionType = new SR();
        rec.lang = language;            // Set language
        rec.interimResults = true;      // Allow live partial results
        rec.continuous = false;         // Stop on pause

        // Fired when recognition receives speech results
        rec.onresult = (e: any) => {
            let finalTranscript = '';
            let liveInterim = '';

            // Loop through all speech results
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0]?.transcript ?? '';
                if (!transcript) continue;
                if (e.results[i].isFinal) {
                    // Add finalized speech
                    finalTranscript += transcript;
                } else {
                    // Add ongoing speech
                    liveInterim += transcript;
                }
            }

            // Show interim text live
            setInterimText(liveInterim);

            // When final text is ready, send it to parent
            if (finalTranscript) {
                setInterimText('');
                onFinalTranscript.current(finalTranscript);
            }
        };

        // Handle recognition errors
        rec.onerror = (e: any) => {
            if (e?.error === 'not-allowed') {
                toast.error('Microphone permission denied.');
            } else if (e?.error === 'no-speech') {
                toast('No speech detected.');
            } else {
                toast.error('Speech recognition error.');
            }
            setIsListening(false);
        };

        // Fires when recognition stops (manually or automatically)
        rec.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        recognitionRef.current = rec;

        // Cleanup on unmount
        return () => {
            try {
                recognitionRef.current?.abort();
            } catch { }
            recognitionRef.current = null;
        };
    }, [language]);

    // Start speech recognition
    const startListening = useCallback(() => {
        if (!supportsSTT || !recognitionRef.current) {
            toast.error('Speech recognition not supported.');
            return;
        }
        if (isListening) return; // Avoid restarting if already listening

        try {
            setInterimText('');
            recognitionRef.current.start();
            setIsListening(true);
        } catch {
            // If already started, restart
            try {
                recognitionRef.current.abort();
                recognitionRef.current.start();
                setIsListening(true);
            } catch {
                toast.error('Could not start microphone.');
            }
        }
    }, [supportsSTT, isListening]);

    // Stop speech recognition
    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListening) return;
        try {
            recognitionRef.current.stop();
        } catch { }
        setIsListening(false);
    }, [isListening]);

    // Toggle between start/stop
    const toggleMic = useCallback(() => {
        if (isListening) stopListening();
        else startListening();
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        supportsSTT,
        interimText,
        startListening,
        stopListening,
        toggleMic,
        /**
         * Allows parent component to set a callback function
         * that gets executed when final speech text is available
         */
        setOnFinalTranscript: (cb: (text: string) => void) => {
            onFinalTranscript.current = cb;
        }
    };
}
