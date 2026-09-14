export enum VoiceKnowledgeStatus {
  Processing = "Processing",
  Active = "Active",
  Failed = "Failed",
  Disabled = "Disabled",
  HeldForReview = "HeldForReview",
}

export const VOICE_KNOWLEDGE_ERROR_KEYS: Record<string, string> = {
  VOICE_KNOWLEDGE_NO_READABLE_TEXT: "NoReadableText",
  VOICE_KNOWLEDGE_ENCRYPTED_DOCUMENT: "EncryptedDocument",
  VOICE_KNOWLEDGE_EXTRACTION_FAILED: "ExtractionFailed",
  VOICE_KNOWLEDGE_CONDENSE_OUTPUT_INVALID: "CondenseOutputInvalid",
  VOICE_KNOWLEDGE_NO_BUSINESS_FACTS: "NoBusinessFacts",
  VOICE_KNOWLEDGE_SUSPECTED_INJECTION: "SuspectedInjection",
  VOICE_KNOWLEDGE_FILE_TOO_LARGE: "sizeError",
  VOICE_KNOWLEDGE_UNSUPPORTED_FILE_TYPE: "sizeError",
  VOICE_KNOWLEDGE_DOCUMENT_LIMIT_REACHED: "countError",
  VOICE_KNOWLEDGE_REGENERATE_LIMIT_REACHED: "regenerateCap",
  VOICE_KNOWLEDGE_MANUAL_EDIT_CONFIRMATION_REQUIRED: "regenerateConfirm",
  VOICE_KNOWLEDGE_ILLEGAL_TRANSITION: "error",
  VOICE_KNOWLEDGE_FILE_STORAGE_FAILED: "ExtractionFailed",
};

export const VOICE_KNOWLEDGE_REQUEST_ERROR_KEYS: Record<string, string> = {
  VOICE_KNOWLEDGE_UPLOAD_DAILY_LIMIT_REACHED: "uploadDailyLimit",
  VOICE_KNOWLEDGE_UPLOAD_DAILY_BYTES_EXCEEDED: "uploadDailyBytes",
};
