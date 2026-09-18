import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  MoreVertical,
  Pencil,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useVoiceKnowledge,
  useVoiceUnanswered,
} from "@/data/hooks/useVoiceKnowledge";
import {
  readKnowledgeFacts,
  type VoiceKnowledgeDocument,
  type VoiceKnowledgeLimits,
} from "@/data/repositories/voiceKnowledge";
import {
  VoiceKnowledgeStatus as Status,
  VOICE_KNOWLEDGE_ERROR_KEYS,
  VOICE_KNOWLEDGE_FALLBACK_LIMITS,
  VOICE_KNOWLEDGE_REQUEST_ERROR_KEYS,
} from "@/constants/voiceKnowledge";

const BYTES_PER_MB = 1024 * 1024;
const buttonClass =
  "rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-sm font-medium text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50";

const formatUploadedDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
};

const statusClass: Record<Status, string> = {
  [Status.Processing]: "border-blue-200 bg-blue-50 text-blue-700",
  [Status.Active]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [Status.Failed]: "border-red-200 bg-red-50 text-red-700",
  [Status.Disabled]: "border-slate-200 bg-slate-100 text-slate-600",
  [Status.HeldForReview]: "border-amber-200 bg-amber-50 text-amber-800",
};

function KnowledgeFileIcon({ extension }: { extension: string }) {
  const normalized = extension.replace(".", "").toUpperCase();
  const colors =
    normalized === "PDF"
      ? "border-red-200 bg-red-50 text-red-600"
      : normalized === "DOCX"
        ? "border-indigo-200 bg-indigo-50 text-indigo-600"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <span
      className={`relative flex h-10 w-9 shrink-0 items-center justify-center rounded-md border ${colors}`}
      aria-hidden="true"
    >
      <FileText className="h-5 w-5" />
      <span className="absolute -bottom-1 rounded-sm bg-white px-0.5 text-[8px] font-bold leading-3">
        {normalized || "FILE"}
      </span>
    </span>
  );
}

export function VoiceKnowledgePanel() {
  const { t } = useTranslation();
  const { showConfirm } = useNotification();
  const text = (key: string) => t(`voiceKnowledge.${key}`);
  const interpolate = (key: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [name, value]) =>
        result.split(`{${name}}`).join(String(value)),
      text(key),
    );
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const downloadsInProgress = useRef(new Set<string>());
  const [page, setPage] = useState(1);
  const { query, mutation, actions } = useVoiceKnowledge(page);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [facts, setFacts] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const documents = query.data?.items ?? [];
  const count = query.data?.slotsUsed ?? 0;
  const activeChars = query.data?.activeCharacters ?? 0;
  const limits = query.data?.limits ?? VOICE_KNOWLEDGE_FALLBACK_LIMITS;
  // Every message that quotes a cap reads from here, so one server response updates the help text, the
  // validation errors and the meters together instead of leaving a stale number behind in a translation.
  const limitValues = {
    sizeMb: Math.round(limits.maxFileSizeBytes / BYTES_PER_MB),
    documents: limits.maxDocuments,
    characters: limits.maxContentCharacters.toLocaleString(),
    total: limits.maxTotalCharacters.toLocaleString(),
    regenerates: limits.maxRegeneratesPerDay,
  };
  const limitText = (key: string) => interpolate(key, limitValues);
  const slotsRemaining = Math.max(0, limits.maxDocuments - count);
  const locked = (query.error as { status?: number })?.status === 403;
  const uploadDisabled =
    locked ||
    query.isPending ||
    query.isError ||
    mutation.isPending ||
    count >= limits.maxDocuments;

  useEffect(() => {
    if (!openMenuId) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };
    window.document.addEventListener("pointerdown", closeOnOutsideClick);
    window.document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenuId]);

  const run = async (action: () => Promise<unknown>) => {
    setMessage("");
    try {
      await mutation.mutateAsync(action);
      return true;
    } catch (error) {
      const code = String((error as { errorCode?: string })?.errorCode ?? "");
      setMessage(
        limitText(
          VOICE_KNOWLEDGE_REQUEST_ERROR_KEYS[code] ??
            VOICE_KNOWLEDGE_ERROR_KEYS[code] ??
            "error",
        ),
      );
      return false;
    }
  };

  const canRegenerate = (document: VoiceKnowledgeDocument) =>
    !document.lastRegeneratedAt ||
    document.lastRegeneratedAt.slice(0, 10) !==
      new Date().toISOString().slice(0, 10) ||
    document.regenerateCount < limits.maxRegeneratesPerDay;

  const download = async (document: VoiceKnowledgeDocument) => {
    if (downloadsInProgress.current.has(document.id)) return;
    downloadsInProgress.current.add(document.id);
    setMessage("");
    setDownloadingIds(new Set(downloadsInProgress.current));
    try {
      const blob = await actions.download(document.id);
      const objectUrl = URL.createObjectURL(blob);
      try {
        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = document.fileName;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      setMessage(text("error"));
    } finally {
      downloadsInProgress.current.delete(document.id);
      setDownloadingIds(new Set(downloadsInProgress.current));
    }
  };

  const handleFile = (file?: File) => {
    if (!file || uploadDisabled) return;
    if (
      !/\.(txt|docx|pdf)$/i.test(file.name) ||
      file.size > limits.maxFileSizeBytes ||
      file.size === 0
    ) {
      setMessage(limitText("sizeError"));
      return;
    }
    if (count >= limits.maxDocuments) {
      setMessage(limitText("countError"));
      return;
    }
    void run(() => actions.upload(file));
  };

  const save = async () => {
    const content = JSON.stringify({ facts });
    if (
      !facts.length ||
      facts.length > limits.maxFacts ||
      facts.some(
        (fact) =>
          !fact.question.trim() ||
          !fact.answer.trim() ||
          fact.question.length > limits.maxQuestionCharacters ||
          fact.answer.length > limits.maxAnswerCharacters,
      ) ||
      content.length > limits.maxContentCharacters
    ) {
      setMessage(limitText("contentError"));
      return;
    }
    if (editing && (await run(() => actions.content(editing, content)))) {
      setEditing(null);
    }
  };

  const openEditor = (document: VoiceKnowledgeDocument) => {
    setOpenMenuId(null);
    setEditing(document.id);
    setFacts(readKnowledgeFacts(document.condensedContent));
  };

  const menuActionClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-nexoraText hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0";

  return (
    <section className="voice-knowledge-container settings-span-full" aria-label={text("title")}>
      <div className="voice-knowledge-layout grid gap-4">
        <div className="min-w-0 rounded-xl border border-nexoraBorder bg-white">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-nexoraText">
                  {text("filesTitle")}
                </h3>
                <p className="mt-1 text-sm text-nexoraMuted">
                  {text("filesSubtitle")}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-nexoraBrand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => inputRef.current?.click()}
                disabled={uploadDisabled}
              >
                <Upload className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                {mutation.isPending ? text("uploading") : text("uploadFiles")}
              </button>
            </div>

            <div className="flex gap-3 rounded-lg border border-indigo-100 bg-nexoraBrandSoft p-4">
              <Sparkles
                className="mt-0.5 h-5 w-5 shrink-0 text-nexoraBrand"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-nexoraBrandDark">
                  {text("referenceTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-nexoraMuted">
                  {text("referenceDescription")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-nexoraMuted">
                <span className="font-semibold text-nexoraText">
                  {interpolate("filesUsed", {
                    used: count,
                    total: limits.maxDocuments,
                  })}
                </span>
                <span>{interpolate("slotsAvailable", { count: slotsRemaining })}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
                {Array.from({ length: limits.maxDocuments }, (_, index) => (
                  <span
                    key={index}
                    className={`h-1 rounded-full ${index < count ? "bg-nexoraBrand" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-nexoraMuted">
                <span>
                  {interpolate("budget", { used: activeChars.toLocaleString(), total: limits.maxTotalCharacters.toLocaleString() })}
                </span>
                <progress
                  className="h-1.5 w-28 accent-nexoraBrand"
                  max={limits.maxTotalCharacters}
                  value={Math.min(activeChars, limits.maxTotalCharacters)}
                  aria-label={text("budgetProgress")}
                />
              </div>
            </div>

            <input
              ref={inputRef}
              id={inputId}
              className="sr-only"
              type="file"
              accept=".txt,.docx,.pdf"
              aria-label={text("uploadInputAria")}
              disabled={uploadDisabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                handleFile(file);
              }}
            />
            <div
              role="button"
              tabIndex={uploadDisabled ? -1 : 0}
              aria-disabled={uploadDisabled}
              aria-label={text("dropzoneAria")}
              className={`flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition sm:flex-row sm:text-left ${
                uploadDisabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                  : dragActive
                    ? "border-nexoraBrand bg-nexoraBrandSoft"
                    : "cursor-pointer border-indigo-200 bg-nexoraCanvas hover:border-nexoraBrand"
              }`}
              onClick={() => {
                if (!uploadDisabled) inputRef.current?.click();
              }}
              onKeyDown={(event) => {
                if (!uploadDisabled && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!uploadDisabled) setDragActive(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragActive(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="mb-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-white text-nexoraBrand shadow-sm sm:mb-0 sm:mr-3">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="text-sm font-semibold text-nexoraText">
                  {text("dragDrop")}{" "}
                  <span className="font-normal text-nexoraMuted">{text("or")}</span>{" "}
                  <span className="text-nexoraBrand">{text("chooseFiles")}</span>
                </span>
                <span className="mt-1 block text-xs text-nexoraMuted">
                  {text("uploadRequirements")}
                </span>
              </span>
            </div>

            {locked && (
              <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <a href="/dashboard/subscriptions" className="font-medium underline">
                  {text("locked")}
                </a>
              </p>
            )}
            {count >= limits.maxDocuments && (
              <p className="text-sm text-nexoraMuted">{limitText("countError")}</p>
            )}
            {message && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-nexoraRule px-4 py-3 sm:px-6">
            <h4 className="text-sm font-semibold text-nexoraText">{text("uploadedFiles")}</h4>
            <button
              type="button"
              className={buttonClass}
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={`mr-1.5 inline h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {text("retry")}
            </button>
          </div>

          {query.isPending ? (
            <p role="status" className="flex items-center gap-2 border-t border-nexoraRule p-6 text-sm text-nexoraMuted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {text("loading")}
            </p>
          ) : query.isError && !locked ? (
            <p role="alert" className="border-t border-nexoraRule p-6 text-sm text-red-700">
              {text("error")}
            </p>
          ) : !documents.length ? (
            <p className="border-t border-nexoraRule p-8 text-center text-sm text-nexoraMuted">
              {text("empty")}
            </p>
          ) : (
            <div className="border-t border-nexoraRule">
              <table className="block w-full table-fixed md:table" aria-label={text("uploadedFiles")}>
                <thead className="hidden bg-nexoraSurfaceMuted md:table-header-group">
                  <tr>
                    <th className="w-[46%] px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">{text("columnFileName")}</th>
                    <th className="w-[18%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">{text("columnUploaded")}</th>
                    <th className="w-[19%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">{text("columnStatus")}</th>
                    <th className="w-[17%] px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">{text("columnActions")}</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {documents.map((document) => (
                    <DocumentRows
                      key={document.id}
                      document={document}
                      editing={editing === document.id}
                      facts={facts}
                      setFacts={setFacts}
                      mutationPending={mutation.isPending}
                      downloading={downloadingIds.has(document.id)}
                      openMenu={openMenuId === document.id}
                      menuRootRef={openMenuId === document.id ? menuRootRef : undefined}
                      text={text}
                      interpolate={interpolate}
                      limits={limits}
                      limitText={limitText}
                      canRegenerate={canRegenerate(document)}
                      menuActionClass={menuActionClass}
                      onDownload={() => void download(document)}
                      onToggleMenu={() => setOpenMenuId((current) => current === document.id ? null : document.id)}
                      onEdit={() => openEditor(document)}
                      onRegenerate={() => {
                        void (async () => {
                          setOpenMenuId(null);
                          if (!(await showConfirm(text("regenerateConfirm"), text("regenerateConfirmTitle")))) return;
                          await run(() => actions.regenerate(document.id, document.isManuallyEdited));
                        })();
                      }}
                      onActivate={() => {
                        void (async () => {
                          setOpenMenuId(null);
                          if (!(await showConfirm(text("activateConfirm"), text("activateConfirmTitle")))) return;
                          await run(() => actions.status(document.id, Status.Active));
                        })();
                      }}
                      onToggleStatus={() => {
                        void (async () => {
                          setOpenMenuId(null);
                          const nextStatus = document.status === Status.Disabled ? Status.Active : Status.Disabled;
                          const reactivatesFlaggedContent =
                            nextStatus === Status.Active && document.injectionFlags.length > 0;
                          if (nextStatus === Status.Disabled) {
                            if (!(await showConfirm(text("disableConfirm"), text("disableConfirmTitle")))) return;
                          } else if (reactivatesFlaggedContent) {
                            if (!(await showConfirm(text("activateConfirm"), text("activateConfirmTitle")))) return;
                          }
                          await run(() => actions.status(document.id, nextStatus));
                        })();
                      }}
                      onDelete={() => {
                        void (async () => {
                          setOpenMenuId(null);
                          if (!(await showConfirm(text("deleteConfirm"), text("deleteConfirmTitle")))) return;
                          await run(() => actions.delete(document.id));
                        })();
                      }}
                      onSave={() => void save()}
                      onCancel={() => setEditing(null)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {query.data && query.data.totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-3 border-t border-nexoraRule p-4" aria-label={text("pagination")}>
              <button type="button" className={buttonClass} disabled={!query.data.hasPreviousPage || query.isFetching} onClick={() => setPage((current) => current - 1)}>{text("previousPage")}</button>
              <span role="status" className="text-sm text-nexoraMuted">
                {interpolate("pageOf", { page: query.data.pageNumber, total: query.data.totalPages })}
              </span>
              <button type="button" className={buttonClass} disabled={!query.data.hasNextPage || query.isFetching} onClick={() => setPage((current) => current + 1)}>{text("nextPage")}</button>
            </nav>
          )}
        </div>

        <aside className="voice-knowledge-guide rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-nexoraText">
            <Lightbulb className="h-5 w-5 text-nexoraBrand" aria-hidden="true" />
            {text("guideTitle")}
          </h3>
          <div className="mt-6 space-y-6">
            <GuideItem icon={<ShieldCheck className="h-4 w-4" />} title={text("guidePolicyTitle")} body={text("guidePolicyBody")} />
            <GuideItem icon={<Sparkles className="h-4 w-4" />} title={text("guideServiceTitle")} body={text("guideServiceBody")} />
            <GuideItem icon={<MessageSquareText className="h-4 w-4" />} title={text("guideFaqTitle")} body={text("guideFaqBody")} />
          </div>
          <div className="my-6 border-t border-nexoraRule" />
          <GuideItem icon={<RefreshCw className="h-4 w-4" />} title={text("guideKeepUpdatedTitle")} body={text("guideKeepUpdatedBody")} />
        </aside>
      </div>
    </section>
  );
}

type DocumentRowsProps = {
  document: VoiceKnowledgeDocument;
  editing: boolean;
  facts: Array<{ question: string; answer: string }>;
  setFacts: React.Dispatch<React.SetStateAction<Array<{ question: string; answer: string }>>>;
  mutationPending: boolean;
  downloading: boolean;
  openMenu: boolean;
  menuRootRef?: React.RefObject<HTMLDivElement>;
  text: (key: string) => string;
  interpolate: (key: string, values: Record<string, string | number>) => string;
  limits: VoiceKnowledgeLimits;
  limitText: (key: string) => string;
  canRegenerate: boolean;
  menuActionClass: string;
  onDownload: () => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onActivate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
};

function DocumentRows({
  document, editing, facts, setFacts, mutationPending, downloading, openMenu,
  menuRootRef, text, interpolate, limits, limitText, canRegenerate, menuActionClass, onDownload,
  onToggleMenu, onEdit, onRegenerate, onActivate, onToggleStatus, onDelete,
  onSave, onCancel,
}: DocumentRowsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isEditable = [Status.Active, Status.Disabled, Status.HeldForReview].includes(document.status);

  useEffect(() => {
    if (!openMenu) return;
    menuRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
  }, [openMenu]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      triggerRef.current?.focus();
      onToggleMenu();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(window.document.activeElement as HTMLElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <>
      <tr className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-nexoraRule p-3 last:border-b-0 md:table-row md:p-0">
        <td className="col-span-2 min-w-0 md:col-auto md:table-cell md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <KnowledgeFileIcon extension={document.fileExtension} />
            <div className="min-w-0">
              <strong className="block truncate text-sm text-nexoraText" title={document.fileName}>{document.fileName}</strong>
              <span className="mt-0.5 block text-xs text-nexoraMuted">{formatFileSize(document.fileSizeBytes)}</span>
            </div>
          </div>
        </td>
        <td className="min-w-0 text-xs text-nexoraMuted md:table-cell md:px-4 md:py-4">
          <span className="mr-1 font-medium text-nexoraText md:hidden">{text("columnUploaded")}:</span>
          {formatUploadedDate(document.createdAt)}
        </td>
        <td className="contents md:table-cell md:px-4 md:py-4 md:align-top">
          <span className={`inline-flex items-center gap-1 justify-self-end rounded border px-2 py-1 text-xs font-medium md:justify-self-auto ${statusClass[document.status]}`}>
            {document.status === Status.Processing ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : document.status === Status.Failed || document.status === Status.HeldForReview ? <AlertTriangle className="h-3 w-3" aria-hidden="true" /> : <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
            {text(Status[document.status])}
          </span>
          {(document.isManuallyEdited || document.isEditedAfterApproval || document.isOverBudget || document.injectionFlags.length > 0 || document.failureReasonCode) ? (
            <div className="col-span-2 space-y-1 text-xs leading-4 md:mt-2">
              {document.isManuallyEdited && <p className="text-nexoraMuted">{text("manual")}</p>}
              {document.isEditedAfterApproval && <p role="alert" className="font-medium text-amber-700">{text("editedAfterApproval")}</p>}
              {document.isOverBudget && <p role="status" className="text-amber-700">{text("overBudget")}</p>}
              {document.injectionFlags.length > 0 && <p role="alert" className="text-amber-700">{text("flags")}: {document.injectionFlags.join(", ")}</p>}
              {document.failureReasonCode && <p role="alert" className="text-red-700">{text(VOICE_KNOWLEDGE_ERROR_KEYS[document.failureReasonCode] ?? "error")}</p>}
            </div>
          ) : null}
        </td>
        <td className="col-span-2 md:col-auto md:table-cell md:px-4 md:py-4 md:text-right md:align-top">
          <div className="flex items-center gap-1 md:justify-end">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText disabled:opacity-50" aria-label={interpolate("downloadFileAria", { name: document.fileName })} disabled={downloading} onClick={onDownload}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
              {downloading ? text("downloading") : text("download")}
            </button>
            <div className="relative" ref={openMenu ? menuRootRef : undefined}>
              <button ref={triggerRef} type="button" className="rounded-md p-2 text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText" aria-label={interpolate("actionsFor", { name: document.fileName })} aria-haspopup="menu" aria-expanded={openMenu} onClick={onToggleMenu}>
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              {openMenu && (
                <div ref={menuRef} role="menu" className="absolute left-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-nexoraBorder bg-white py-1 text-left shadow-lg md:left-auto md:right-0" onKeyDown={handleMenuKeyDown}>
                  {isEditable && <button type="button" role="menuitem" className={menuActionClass} disabled={mutationPending} onClick={onEdit}><Pencil aria-hidden="true" />{text("edit")}</button>}
                  {document.status !== Status.Processing && <button type="button" role="menuitem" className={menuActionClass} disabled={mutationPending || !canRegenerate} title={!canRegenerate ? limitText("regenerateCap") : undefined} onClick={onRegenerate}><RefreshCw aria-hidden="true" />{text("regenerate")}</button>}
                  {document.status === Status.HeldForReview && <button type="button" role="menuitem" className={menuActionClass} disabled={mutationPending} onClick={onActivate}><Power aria-hidden="true" />{text("activate")}</button>}
                  {isEditable && <button type="button" role="menuitem" className={menuActionClass} disabled={mutationPending} onClick={onToggleStatus}><Power aria-hidden="true" />{text(document.status === Status.Disabled ? "enable" : "disable")}</button>}
                  <button type="button" role="menuitem" className={`${menuActionClass} text-red-600 hover:bg-red-50`} disabled={mutationPending} onClick={onDelete}><Trash2 aria-hidden="true" />{text("delete")}</button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="block border-b border-nexoraRule bg-nexoraCanvas md:table-row">
          <td className="block p-4 md:table-cell md:px-6 md:py-5" colSpan={4}>
            <div role="region" aria-label={interpolate("editRegionAria", { name: document.fileName })} className="space-y-4">
              {facts.map((fact, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-nexoraBorder bg-white p-4">
                  <label className="text-sm font-medium text-nexoraText">
                    {text("question")}
                    <input className="mt-1 block w-full rounded-lg border border-nexoraBorder p-2 text-sm" value={fact.question} maxLength={limits.maxQuestionCharacters} placeholder={text("questionPlaceholder")} onChange={(event) => setFacts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} />
                  </label>
                  <label className="text-sm font-medium text-nexoraText">
                    {text("answer")}
                    <textarea className="mt-1 block w-full rounded-lg border border-nexoraBorder p-2 text-sm" rows={3} value={fact.answer} maxLength={limits.maxAnswerCharacters} placeholder={text("answerPlaceholder")} onChange={(event) => setFacts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} />
                  </label>
                  <button type="button" className="justify-self-start text-sm font-medium text-red-600 hover:underline" onClick={() => setFacts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{text("remove")}</button>
                </div>
              ))}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-nexoraMuted">{JSON.stringify({ facts }).length} / {limits.maxContentCharacters}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClass} disabled={mutationPending || facts.length >= limits.maxFacts} onClick={() => setFacts((current) => [...current, { question: "", answer: "" }])}>{text("add")}</button>
                  <button type="button" className="rounded-lg bg-nexoraBrand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={mutationPending} onClick={onSave}>{text("save")}</button>
                  <button type="button" className={buttonClass} disabled={mutationPending} onClick={onCancel}>{text("cancel")}</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function GuideItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraMuted">{icon}</span>
      <div>
        <p className="text-xs font-semibold leading-5 text-nexoraText">{title}</p>
        <p className="mt-1 text-xs leading-5 text-nexoraMuted">{body}</p>
      </div>
    </div>
  );
}

/** Temporarily unmounted from merchant UI until unanswered questions is ready to show again. */
export function VoiceUnansweredPanel() {
  const { t } = useTranslation();
  const text = (key: string) => t(`voiceKnowledge.${key}`);
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  const valid = Boolean(from && to && days >= 0 && days < 366);
  const query = useVoiceUnanswered(from, to, valid);
  return (
    <section
      className="rounded-xl border p-4 space-y-4"
      aria-label={text("unanswered")}
    >
      <h3 className="text-lg font-semibold">{text("unanswered")}</h3>
      <p>{text("unansweredHelp")}</p>
      <div className="flex flex-wrap gap-3">
        <label>
          {text("from")}
          <input
            className="block rounded border p-2"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          {text("to")}
          <input
            className="block rounded border p-2"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      {!valid ? (
        <p role="alert">{text("dateError")}</p>
      ) : query.isPending ? (
        <p role="status">{text("loading")}</p>
      ) : query.isError ? (
        <p role="alert">
          {text("error")}{" "}
          <button
            type="button"
            className={buttonClass}
            onClick={() => void query.refetch()}
          >
            {text("retry")}
          </button>
        </p>
      ) : !query.data?.length ? (
        <p>{text("noQuestions")}</p>
      ) : (
        <ul className="space-y-2">
          {query.data.map((item, index) => (
            <li
              key={index}
              className="flex flex-wrap justify-between gap-2 border-b py-2"
            >
              <span className="break-words">{item.question}</span>
              <span>
                {text("calls")}: {item.callCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
