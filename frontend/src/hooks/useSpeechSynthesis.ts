import { useCallback, useState, useEffect } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synth = window.speechSynthesis;

  const updateVoices = useCallback(() => {
    setVoices(synth.getVoices());
  }, [synth]);

  useEffect(() => {
    updateVoices();
    synth.onvoiceschanged = updateVoices; // Wichtig, da Stimmen asynchron geladen werden

    return () => {
      synth.onvoiceschanged = null;
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

    // Finde eine passende Stimme für die ausgewählte Sprache
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) {
      utterance.voice = voice;
    }

    synth.cancel(); // Stoppt vorherige Ausgaben
    synth.speak(utterance);
  }, [synth, voices]);

  return { speak };
};