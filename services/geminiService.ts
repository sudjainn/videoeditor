/**
 * Gemini Service for Video Editor
 * Handles calls to Gemini backend endpoints for audio, text, and image generation
 */

const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const GEMINI_AUDIO_API_URL = `${API_BASE_URL}/social-media/openai/generate_gemini_audio`;
const GENERATE_GEMINI_TEXT_URL = `${API_BASE_URL}/social-media/openai/generate_gemini_text`;

/**
 * Generates audio from text using Gemini TTS
 * Calls backend generate_gemini_audio endpoint which handles credit deduction
 * @param text The text to convert to speech
 * @param voiceName The voice name (e.g., 'Zephyr', 'Phoebe', 'Charon', etc.)
 * @param model Optional model override (default: 'gemini-2.5-flash-preview-tts')
 * @returns Base64 encoded audio data
 */
export async function generateAudioFromText(
  text: string,
  voiceName: string = 'Zephyr',
  model: string = 'gemini-2.5-flash-preview-tts'
): Promise<string> {
  try {
    if (!text.trim()) {
      throw new Error('Text is required for audio generation');
    }

    const payload = {
      model,
      text,
      voiceName
    };

    console.log('Requesting audio generation:', { text: text.substring(0, 50) + '...', voiceName, model });

    const response = await fetch(GEMINI_AUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status, response.statusText);
    
    // Get response text first to debug
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText} - ${responseText}`);
    }

    if (!responseText) {
      throw new Error('Empty response from API');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'Audio generation failed');
    }

    if (!data.audioData) {
      throw new Error('No audio data returned from API');
    }

    console.log('Audio generated successfully, size:', data.audioData.length);

    return data.audioData;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcribes audio to subtitles using Gemini backend endpoint
 * Calls backend adv_generate_text which handles credit deduction and API key security
 * @param audioBlob The audio file blob
 * @param clipDuration Duration of the audio clip in seconds
 * @param model Optional model override (default: 'gemini-2.5-flash')
 * @returns Array of subtitle words with timing and chunk information
 */
export async function transcribeAudioToSubtitles(
  audioBlob: Blob,
  clipDuration: number,
  model: string = 'gemini-2.5-flash'
): Promise<Array<{ word: string; time: number; chunkId: number }>> {
  try {
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Audio blob is required for transcription');
    }

    if (audioBlob.size > 20 * 1024 * 1024) {
      throw new Error('Audio file too large. Please use a clip under 20MB.');
    }

    const base64Audio = await blobToBase64(audioBlob);
    const prompt = `Transcribe the provided audio into subtitles. 
      Return a JSON array of objects for the entire clip (${clipDuration}s).
      Each object must have:
      - "word": the word spoken
      - "time": the start time in seconds relative to the clip start
      - "chunkId": index of the sentence block or logical phrase (groups words together visually)
      Return ONLY the JSON array.`;

    const payload = {
      model,
      temperature: 0.3,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/mp3',
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              word: { type: 'STRING' },
              time: { type: 'NUMBER' },
              chunkId: { type: 'NUMBER' }
            },
            required: ['word', 'time', 'chunkId']
          }
        }
      }
    };

    console.log('Requesting audio transcription from backend:', { clipDuration, model, audioSize: audioBlob.size });

    const response = await fetch(GENERATE_GEMINI_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Transcription response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('Transcription response:', responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText} - ${responseText}`);
    }

    if (!responseText) {
      throw new Error('Empty response from API');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'Audio transcription failed');
    }

    // Extract subtitles from Gemini API response structure
    let subtitles = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!subtitles) {
      throw new Error('No transcription data returned from API');
    }

    // Parse if it's a string
    if (typeof subtitles === 'string') {
      try {
        subtitles = JSON.parse(subtitles);
      } catch (e) {
        throw new Error(`Failed to parse transcription response: ${subtitles}`);
      }
    }

    if (!Array.isArray(subtitles)) {
      throw new Error('Invalid response format: expected array of subtitle objects');
    }

    // Validate and sort subtitles
    const validSubtitles = subtitles.filter((s: any) => 
      s.word && typeof s.time === 'number' && typeof s.chunkId === 'number'
    );

    validSubtitles.sort((a: any, b: any) => a.time - b.time);

    console.log('Audio transcribed successfully:', validSubtitles.length, 'words');

    return validSubtitles;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}
