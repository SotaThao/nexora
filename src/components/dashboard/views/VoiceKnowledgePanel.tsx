import { useRef, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  useVoiceKnowledge,
  useVoiceUnanswered,
} from "@/data/hooks/useVoiceKnowledge";
import {
  readKnowledgeFacts,
  type VoiceKnowledgeDocument,
} from "@/data/repositories/voiceKnowledge";
import {
  VoiceKnowledgeStatus as Status,
  VOICE_KNOWLEDGE_ERROR_KEYS,
  VOICE_KNOWLEDGE_REQUEST_ERROR_KEYS,
} from "@/constants/voiceKnowledge";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENTS = 5;
const MAX_CONTENT_CHARS = 8000;
const MAX_REGENERATIONS = 3;
const MAX_FACTS = 40;
const MAX_QUESTION_CHARS = 300;
const MAX_ANSWER_CHARS = 1500;
const buttonClass = "rounded-lg border px-3 py-2 text-sm disabled:opacity-50";

export function VoiceKnowledgePanel() {
  const { t } = useTranslation();
  const text = (key: string) => t(`voiceKnowledge.${key}`);
  const [page, setPage] = useState(1);
  const { query, mutation, actions } = useVoiceKnowledge(page);
  const [message, setMessage] = useState("");
  const downloadsInProgress = useRef(new Set<string>());
  const [downloadingIds, setDownloadingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [facts, setFacts] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const documents = query.data?.items ?? [];
  // Tenant-wide totals from the server, not derived from `documents`: these gate the upload button and
  // the budget meter, and the page on screen is only part of the picture once history grows.
  const count = query.data?.slotsUsed ?? 0;
  const activeChars = query.data?.activeCharacters ?? 0;
  const locked = (query.error as { status?: number })?.status === 403;
  const run = async (action: () => Promise<unknown>) => {
    setMessage("");
    try {
      await mutation.mutateAsync(action);
      return true;
    } catch (error) {
      const code = String((error as { errorCode?: string })?.errorCode ?? "");
      setMessage(
        text(
          VOICE_KNOWLEDGE_REQUEST_ERROR_KEYS[code] ??
            VOICE_KNOWLEDGE_ERROR_KEYS[code] ??
            "error",
        ),
      );
      return false;
    }
  };
  const canRegenerate = (d: VoiceKnowledgeDocument) =>
    !d.lastRegeneratedAt ||
    d.lastRegeneratedAt.slice(0, 10) !==
      new Date().toISOString().slice(0, 10) ||
    d.regenerateCount < MAX_REGENERATIONS;
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
  const save = async () => {
    const content = JSON.stringify({ facts });
    if (
      !facts.length ||
      facts.length > MAX_FACTS ||
      facts.some(
        (f) =>
          !f.question.trim() ||
          !f.answer.trim() ||
          f.question.length > MAX_QUESTION_CHARS ||
          f.answer.length > MAX_ANSWER_CHARS,
      ) ||
      content.length > MAX_CONTENT_CHARS
    ) {
      setMessage(text("contentError"));
      return;
    }
    if (await run(() => actions.content(editing!, content))) setEditing(null);
  };
  return (
    <section
      className="rounded-xl border p-4 space-y-4"
      aria-label={text("title")}
    >
      <h3 className="text-lg font-semibold">{text("title")}</h3>
      <p className="text-sm">{text("help")}</p>
      <p>{text("budget").replace("{used}", activeChars.toLocaleString())}</p>
      <progress
        className="w-full"
        max={20000}
        value={Math.min(activeChars, 20000)}
        aria-label={text("title")}
      />
      {locked && (
        <p role="alert">
          <a href="/dashboard/subscriptions" className="underline">
            {text("locked")}
          </a>
        </p>
      )}
      <label className="block">
        {text("upload")}
        <input
          className="block max-w-full"
          type="file"
          accept=".txt,.docx,.pdf"
          disabled={
            locked ||
            query.isPending ||
            query.isError ||
            mutation.isPending ||
            count >= MAX_DOCUMENTS
          }
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !/\.(txt|docx|pdf)$/i.test(file.name) ||
              file.size > MAX_FILE_BYTES ||
              file.size === 0
            ) {
              setMessage(text("sizeError"));
              return;
            }
            if (count >= MAX_DOCUMENTS) {
              setMessage(text("countError"));
              return;
            }
            void run(() => actions.upload(file));
          }}
        />
      </label>
      {count >= MAX_DOCUMENTS && <p>{text("countError")}</p>}
      {message && <p role="alert">{message}</p>}
      {query.isPending && <p role="status">{text("loading")}</p>}
      {query.isError && !locked && <p role="alert">{text("error")}</p>}
      <button
        type="button"
        className={buttonClass}
        onClick={() => void query.refetch()}
        disabled={query.isFetching}
      >
        {text("retry")}
      </button>
      {!query.isPending && !query.isError && !documents.length && (
        <p>{text("empty")}</p>
      )}
      {documents.map((d) => (
        <article key={d.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <strong className="break-all">{d.fileName}</strong>
            <span
              className={d.status === Status.HeldForReview ? "font-bold" : ""}
            >
              {text(Status[d.status])}
            </span>
          </div>
          {d.processedAt && (
            <p className="text-sm">
              {text("processed")}: {new Date(d.processedAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
          {d.isManuallyEdited && <p>{text("manual")}</p>}
          {d.isEditedAfterApproval && (
            <p role="alert" className="font-medium text-amber-700">
              {text("editedAfterApproval")}
            </p>
          )}
          {d.isOverBudget && <p role="status">{text("overBudget")}</p>}
          {d.injectionFlags.length > 0 && (
            <p role="alert">
              {text("flags")}: {d.injectionFlags.join(", ")}
            </p>
          )}
          {d.failureReasonCode && (
            <p role="alert">
              {text(VOICE_KNOWLEDGE_ERROR_KEYS[d.failureReasonCode] ?? "error")}
            </p>
          )}
          <button
            type="button"
            className={buttonClass}
            disabled={downloadingIds.has(d.id)}
            onClick={() => void download(d)}
          >
            {downloadingIds.has(d.id) ? text("downloading") : text("original")}
          </button>
          {editing === d.id ? (
            <div className="space-y-3">
              {facts.map((fact, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded border p-3"
                >
                  <label>
                    {text("question")}
                    <input
                      className="block w-full rounded border p-2"
                      value={fact.question}
                      maxLength={MAX_QUESTION_CHARS}
                      onChange={(e) =>
                        setFacts(
                          facts.map((f, i) =>
                            i === index
                              ? { ...f, question: e.target.value }
                              : f,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {text("answer")}
                    <textarea
                      className="block w-full rounded border p-2"
                      rows={3}
                      value={fact.answer}
                      maxLength={MAX_ANSWER_CHARS}
                      onChange={(e) =>
                        setFacts(
                          facts.map((f, i) =>
                            i === index ? { ...f, answer: e.target.value } : f,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setFacts(facts.filter((_, i) => i !== index))
                    }
                  >
                    {text("remove")}
                  </button>
                </div>
              ))}
              <p>
                {JSON.stringify({ facts }).length} / {MAX_CONTENT_CHARS}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending || facts.length >= MAX_FACTS}
                  onClick={() =>
                    setFacts([...facts, { question: "", answer: "" }])
                  }
                >
                  {text("add")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending}
                  onClick={() => void save()}
                >
                  {text("save")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending}
                  onClick={() => setEditing(null)}
                >
                  {text("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[Status.Active, Status.Disabled, Status.HeldForReview].includes(
                d.status,
              ) && (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending}
                  onClick={() => {
                    setEditing(d.id);
                    setFacts(readKnowledgeFacts(d.condensedContent));
                  }}
                >
                  {text("edit")}
                </button>
              )}
              {d.status !== Status.Processing && (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending || !canRegenerate(d)}
                  title={!canRegenerate(d) ? text("regenerateCap") : undefined}
                  onClick={() => {
                    if (
                      !d.isManuallyEdited ||
                      window.confirm(text("regenerateConfirm"))
                    )
                      void run(() =>
                        actions.regenerate(d.id, d.isManuallyEdited),
                      );
                  }}
                >
                  {text("regenerate")}
                </button>
              )}
              {d.status === Status.HeldForReview && (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (window.confirm(text("activateConfirm")))
                      void run(() => actions.status(d.id, Status.Active));
                  }}
                >
                  {text("activate")}
                </button>
              )}
              {[Status.Active, Status.Disabled, Status.HeldForReview].includes(
                d.status,
              ) && (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={mutation.isPending}
                  onClick={() =>
                    void run(() =>
                      actions.status(
                        d.id,
                        d.status === Status.Disabled
                          ? Status.Active
                          : Status.Disabled,
                      ),
                    )
                  }
                >
                  {text(d.status === Status.Disabled ? "enable" : "disable")}
                </button>
              )}
              <button
                type="button"
                className={buttonClass}
                disabled={mutation.isPending}
                onClick={() => {
                  if (window.confirm(text("deleteConfirm")))
                    void run(() => actions.delete(d.id));
                }}
              >
                {text("delete")}
              </button>
            </div>
          )}
        </article>
      ))}
      {query.data && query.data.totalPages > 1 && (
        <nav className="flex items-center gap-3" aria-label={text("pagination")}>
          <button
            type="button"
            className={buttonClass}
            disabled={!query.data.hasPreviousPage || query.isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            {text("previousPage")}
          </button>
          <span role="status">
            {text("pageOf")
              .replace("{page}", String(query.data.pageNumber))
              .replace("{total}", String(query.data.totalPages))}
          </span>
          <button
            type="button"
            className={buttonClass}
            disabled={!query.data.hasNextPage || query.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            {text("nextPage")}
          </button>
        </nav>
      )}
    </section>
  );
}

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
