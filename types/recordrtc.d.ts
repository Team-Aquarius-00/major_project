declare module 'recordrtc' {
  class RecordRTC {
    constructor(
      stream: MediaStream,
      options?: {
        type?: string
        mimeType?: string
        sampleRate?: number
        desiredSampleRate?: number
        numberOfAudioChannels?: number
        timeSlice?: number
      },
    )
    startRecording(): void
    stopRecording(callback?: () => void): void
    getBlob(): Blob
    destroy(): void
  }
  export default RecordRTC
}
