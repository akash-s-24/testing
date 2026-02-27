import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeStory = async (content: string) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      emotion: "Neutral",
      toxicity: 0.1,
      isCrisis: false,
      suggestion: "Thank you for sharing your story."
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-latest", // Using fast model for analysis as requested
    contents: `Analyze the following emotional story for:
    1. Primary emotion (one of: Joy, Sadness, Anger, Fear, Surprise, Disgust, Hope, Loneliness)
    2. Toxicity score (0 to 1)
    3. Crisis detection (true/false if user expresses self-harm or deep despair)
    4. A short empathetic suggestion or response.

    Story: "${content}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          toxicity: { type: Type.NUMBER },
          isCrisis: { type: Type.BOOLEAN },
          suggestion: { type: Type.STRING }
        },
        required: ["emotion", "toxicity", "isCrisis", "suggestion"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      emotion: "Neutral",
      toxicity: 0.1,
      isCrisis: false,
      suggestion: "Thank you for sharing."
    };
  }
};

export const transcribeAudio = async (base64Audio: string) => {
  if (!process.env.GEMINI_API_KEY) return "Transcription unavailable.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
          { text: "Transcribe this audio accurately." },
        ],
      },
    ],
  });

  return response.text || "";
};

export const generateSpeech = async (text: string) => {
  if (!process.env.GEMINI_API_KEY) return null;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say warmly and empathetically: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/wav;base64,${base64Audio}` : null;
};

export const generateAlias = () => {
  const adjectives = ["Silver", "Golden", "Mystic", "Quiet", "Brave", "Soft", "Wild", "Deep", "Calm", "Bright"];
  const nouns = ["Moon", "River", "Star", "Leaf", "Cloud", "Shadow", "Flame", "Ocean", "Wind", "Spirit"];
  const number = Math.floor(Math.random() * 100);
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}${number}`;
};
