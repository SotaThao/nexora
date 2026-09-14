import httpClient from "@/lib/httpClient";
import { VoiceKnowledgeStatus } from "@/constants/voiceKnowledge";
export interface VoiceKnowledgeDocument {
  id: string;
  fileName: string;
  fileExtension: string;
  contentType: string;
  fileSizeBytes: number;
  condensedContent: string | null;
  status: VoiceKnowledgeStatus;
  injectionFlags: string[];
  failureReasonCode: string | null;
  processedAt: string | null;
  createdAt: string;
  isManuallyEdited: boolean;
  isOverBudget: boolean;
  regenerateCount: number;
  lastRegeneratedAt: string | null;
  approvedAt: string | null;
  isEditedAfterApproval: boolean;
}

/**
 * A page of documents plus tenant-wide totals. `slotsUsed` and `activeCharacters` are supplied by the
 * server rather than derived from `items`, because they gate the upload button and the budget meter and
 * would be wrong the moment failed history spills onto a later page.
 */
export interface VoiceKnowledgeDocumentPage {
  items: VoiceKnowledgeDocument[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  slotsUsed: number;
  activeCharacters: number;
}

const base = "/api/v1/merchant/nexora-voice/knowledge-documents";
export const voiceKnowledgeRepository = {
  list: (pageNumber = 1) =>
    httpClient.get<VoiceKnowledgeDocumentPage>(
      `${base}?pageNumber=${pageNumber}`,
    ),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return httpClient.upload<VoiceKnowledgeDocument>(base, form);
  },
  download: (id: string) =>
    httpClient.getBlob(`${base}/${encodeURIComponent(id)}/original`),
  content: (id: string, condensedContent: string) =>
    httpClient.put(`${base}/${encodeURIComponent(id)}/content`, {
      condensedContent,
    }),
  status: (id: string, status: VoiceKnowledgeStatus) =>
    httpClient.put(`${base}/${encodeURIComponent(id)}/status`, { status }),
  regenerate: (id: string, confirmOverwriteManualEdits: boolean) =>
    httpClient.post(`${base}/${encodeURIComponent(id)}/regenerate`, {
      confirmOverwriteManualEdits,
    }),
  delete: (id: string) => httpClient.del(`${base}/${encodeURIComponent(id)}`),
  unanswered: (from: string, to: string) =>
    httpClient.get<
      Array<{ question: string; callCount: number; lastAskedAt: string }>
    >(
      `/api/v1/merchant/nexora-voice/unanswered-questions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
};
export function readKnowledgeFacts(
  content: string | null,
): Array<{ question: string; answer: string }> {
  try {
    const value = JSON.parse(content || "{}");
    return Array.isArray(value.facts)
      ? value.facts.filter(
          (f: { question?: unknown; answer?: unknown }) =>
            typeof f.question === "string" && typeof f.answer === "string",
        )
      : [];
  } catch {
    return [];
  }
}
