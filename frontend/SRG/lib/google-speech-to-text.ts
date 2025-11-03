/**
 * Google Cloud Speech-to-Text Service
 * 
 * This service provides speech-to-text functionality using Google Cloud Speech-to-Text API.
 * It records audio using expo-av and sends it to Google Cloud for transcription.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
// Use legacy API to avoid deprecation runtime error with readAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_CLOUD_SPEECH_API_URL = 'https://speech.googleapis.com/v1/speech:recognize';

export interface SpeechRecognitionOptions {
  languageCode?: string;
  sampleRateHertz?: number;
  encoding?: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'WEBM_OPUS' | 'ENCODING_UNSPECIFIED';
}

export class GoogleSpeechToTextService {
  private apiKey: string | null = null;
  private recording: Audio.Recording | null = null;
  private recordingStartedAt: number | null = null;
  private lastDetectedEncoding: string | undefined;
  private lastDetectedSampleRate: number | undefined;

  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY || null;
    
    if (!this.apiKey) {
      console.warn('⚠️ Google Cloud Speech API key not found. Speech-to-text will not work.');
    }
  }

  /**
   * Check if the service is available (API key is configured)
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      // Request permissions if not granted
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      let recordingOptions: Audio.RecordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      this.lastDetectedEncoding = undefined;
      this.lastDetectedSampleRate = undefined;

      if (Platform.OS === 'android') {
        // Use AMR_NB in 3GP (supported by Google STT) with 8000 Hz
        recordingOptions = {
          android: {
            extension: '.3gp',
            outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
            audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
            sampleRate: 8000,
            numberOfChannels: 1,
            bitRate: 12200,
          },
          ios: Audio.RecordingOptionsPresets.LOW_QUALITY.ios,
          web: Audio.RecordingOptionsPresets.LOW_QUALITY.web,
        } as Audio.RecordingOptions;
        this.lastDetectedEncoding = 'AMR';
        this.lastDetectedSampleRate = 8000;
      } else if (Platform.OS === 'ios') {
        // Record uncompressed Linear PCM (WAV) mono @ 16kHz for Google STT (LINEAR16)
        recordingOptions = {
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          android: Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          web: Audio.RecordingOptionsPresets.HIGH_QUALITY.web,
        } as Audio.RecordingOptions;
        this.lastDetectedEncoding = 'LINEAR16';
        this.lastDetectedSampleRate = 16000;
      }

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      this.recording = recording;
      this.recordingStartedAt = Date.now();
      console.log('🎤 Started recording...');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get the audio URI
   */
  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      if (!uri) {
        throw new Error('No audio file URI returned');
      }

      console.log('🎤 Stopped recording:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.recording = null;
      throw error;
    }
  }

  /**
   * Convert audio file to base64
   */
  private async audioToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        // Some runtimes may not expose EncodingType at runtime; fall back to literal
        encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64',
      } as any);
      return base64;
    } catch (error) {
      console.error('❌ Error converting audio to base64:', error);
      throw error;
    }
  }

  /**
   * Send audio to Google Cloud Speech-to-Text API
   */
  async transcribeAudio(
    audioUri: string,
    options: SpeechRecognitionOptions = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Cloud Speech API key not configured');
    }

    try {
      // Convert audio to base64
      const audioBase64 = await this.audioToBase64(audioUri);

      // Prepare request body; prefer known-good values from recorder when available
      const config: any = {
        languageCode: options.languageCode || 'en-US',
        enableAutomaticPunctuation: true,
      };
      // Only include encoding/sampleRate if we know them (Android AMR_NB)
      if (this.lastDetectedEncoding) {
        config.encoding = this.lastDetectedEncoding; // 'AMR'
      }
      if (this.lastDetectedSampleRate) {
        config.sampleRateHertz = this.lastDetectedSampleRate; // 8000
      }
      const requestBody = {
        config,
        audio: {
          content: audioBase64,
        },
      };

      // Make API request
      const response = await fetch(
        `${GOOGLE_CLOUD_SPEECH_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `Google Cloud Speech API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract transcript from response
      if (data.results && data.results.length > 0) {
        const transcript = data.results[0].alternatives[0].transcript;
        console.log('✅ Transcription successful:', transcript);
        return transcript;
      } else {
        throw new Error('No transcription results returned');
      }
    } catch (error: any) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    } finally {
      // Clean up audio file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up audio file:', cleanupError);
      }
    }
  }

  /**
   * Record and transcribe in one call
   */
  async recordAndTranscribe(
    options: SpeechRecognitionOptions = {}
  ): Promise<string> {
    try {
      await this.startRecording();
      
      // Wait a bit to ensure recording started
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return a function that can be called to stop and transcribe
      // This allows the caller to control when to stop
      return ''; // Placeholder - actual implementation in stopAndTranscribe
    } catch (error) {
      console.error('❌ Error in recordAndTranscribe:', error);
      throw error;
    }
  }

  /**
   * Stop current recording and transcribe
   */
  async stopAndTranscribe(
    options: SpeechRecognitionOptions = {}
  ): Promise<string> {
    try {
      // Enforce minimum recording duration (e.g., 700ms)
      const minMs = 700;
      const startedAt = this.recordingStartedAt ?? Date.now();
      const elapsed = Date.now() - startedAt;
      if (elapsed < minMs) {
        await new Promise(resolve => setTimeout(resolve, minMs - elapsed));
      }

      const audioUri = await this.stopRecording();
      const transcript = await this.transcribeAudio(audioUri, options);
      this.recordingStartedAt = null;
      return transcript;
    } catch (error) {
      console.error('❌ Error in stopAndTranscribe:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleSpeechToTextService = new GoogleSpeechToTextService();

