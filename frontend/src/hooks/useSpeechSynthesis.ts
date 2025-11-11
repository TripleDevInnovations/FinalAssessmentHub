import { useCallback, useState, useEffect } from 'react';

export const useSpeechSynthesis = () => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = window.speechSynthesis;

    const updateVoices = useCallback(() => {
        setVoices(synth.getVoices());
    }, [synth]);

    useEffect(() => {
        updateVoices();
        synth.onvoiceschanged = updateVoices;

        return () => {
            synth.onvoiceschanged = null;
            synth.cancel();
        };
    }, [synth, updateVoices]);

    const speak = useCallback((text: string, lang: string) => {
        if (!synth || !text) {
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: { [key: string]: string } = {
            de: 'de-DE',
            en: 'en-US',
            ru: 'ru-RU',
            ar: 'ar-SA'
        };
        utterance.lang = langMap[lang] || lang;
        
        const voice = voices.find(v => v.lang.startsWith(lang));
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onend = () => {
            setIsSpeaking(false);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
        };

        synth.cancel();
        setIsSpeaking(true);
        synth.speak(utterance);
    }, [synth, voices]);

    const cancel = useCallback(() => {
        if (synth) {
            setIsSpeaking(false);
            synth.cancel();
        }
    }, [synth]);

    return { speak, cancel, isSpeaking };
};
