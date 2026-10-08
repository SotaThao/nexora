import { useLayoutEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline, Link, ListOrdered, List, RemoveFormatting, Undo2, Redo2, Wand2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { postingHtmlFromText, sanitizePostingHtml, safePostingLink } from './recruitmentPostingContent'

const TK = 'components.dashboard.views.pos.recruitment.composer.richContent'
const controlClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-nexoraText hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:cursor-default disabled:opacity-40'

interface RecruitmentRichTextEditorProps {
  html: string
  disabled: boolean
  invalid: boolean
  onHtmlChange: (html: string) => void
  onUseAI: () => void
}

export default function RecruitmentRichTextEditor({ html, disabled, invalid, onHtmlChange, onUseAI }: RecruitmentRichTextEditorProps) {
  const { t } = useTranslation()
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<Range | null>(null)
  const formattingRef = useRef(false)
  const history = useRef({ entries: [sanitizePostingHtml(html)], index: 0 })
  const [, setRevision] = useState(0)
  const [states, setStates] = useState<Record<string, boolean>>({})
  const [block, setBlock] = useState('p')
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')

  const remember = (next: string) => {
    const current = history.current
    if (current.entries[current.index] === next) return
    current.entries = [...current.entries.slice(0, current.index + 1), next].slice(-80)
    current.index = current.entries.length - 1
    setRevision((value) => value + 1)
  }

  useLayoutEffect(() => {
    const next = sanitizePostingHtml(html)
    if (editorRef.current && editorRef.current.innerHTML !== next) {
      editorRef.current.innerHTML = next
      remember(next)
    }
  }, [html])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) selectionRef.current = selection.getRangeAt(0).cloneRange()
    const next: Record<string, boolean> = {}
    for (const command of ['bold', 'italic', 'underline', 'insertOrderedList', 'insertUnorderedList']) {
      try { next[command] = document.queryCommandState(command) } catch { next[command] = false }
    }
    setStates(next)
    try { const value = String(document.queryCommandValue('formatBlock')).toLowerCase(); setBlock(['h1', 'h2', 'h3'].includes(value) ? value : 'p') } catch { setBlock('p') }
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    if (selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)) selection.addRange(selectionRef.current)
    else { const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false); selection.addRange(range) }
  }

  const commit = () => {
    const editor = editorRef.current
    if (!editor || disabled) return
    const clean = sanitizePostingHtml(editor.innerHTML)
    // Preserve both boundaries when sanitizing links rewrites their selected nodes.
    const selection = window.getSelection()
    const offsets = selection?.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer) ? (() => {
      const selected = selection.getRangeAt(0)
      const before = document.createRange()
      before.selectNodeContents(editor)
      before.setEnd(selected.startContainer, selected.startOffset)
      const start = before.toString().length
      before.setEnd(selected.endContainer, selected.endOffset)
      return { start, end: before.toString().length, collapsed: selected.collapsed, backwards: !selected.collapsed && selection.anchorNode === selected.endContainer && selection.anchorOffset === selected.endOffset }
    })() : null
    if (editor.innerHTML !== clean) {
      editor.innerHTML = clean
      if (offsets && selection) {
        const boundary = (offset: number): { node: Node; offset: number } => {
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
          let remaining = offset
          let node = walker.nextNode()
          let last: Node | null = null
          while (node) {
            const length = node.textContent?.length ?? 0
            if (remaining <= length) return { node, offset: remaining }
            remaining -= length; last = node; node = walker.nextNode()
          }
          return last ? { node: last, offset: last.textContent?.length ?? 0 } : { node: editor, offset: 0 }
        }
        const start = boundary(offsets.start)
        const end = boundary(offsets.end)
        const range = document.createRange()
        range.setStart(start.node, start.offset)
        range.setEnd(end.node, end.offset)
        if (offsets.collapsed) range.collapse(true)
        selection.removeAllRanges(); selection.addRange(range)
        if (offsets.backwards && typeof selection.setBaseAndExtent === 'function') selection.setBaseAndExtent(end.node, end.offset, start.node, start.offset)
      }
    }
    remember(clean)
    onHtmlChange(clean)
    saveSelection()
  }

  const command = (name: string, value?: string) => {
    if (disabled) return
    restoreSelection()
    try {
      if (!document.queryCommandSupported(name)) { setError(t(`${TK}.unsupported`)); return }
      formattingRef.current = true
      document.execCommand(name, false, value)
      formattingRef.current = false
      setError(''); commit()
    } catch { formattingRef.current = false; setError(t(`${TK}.unsupported`)) }
  }

  const clearFormatting = () => {
    if (disabled) return
    restoreSelection()
    try {
      formattingRef.current = true
      for (const list of ['insertOrderedList', 'insertUnorderedList']) if (document.queryCommandState(list)) document.execCommand(list)
      document.execCommand('removeFormat')
      document.execCommand('unlink')
      document.execCommand('formatBlock', false, 'p')
      formattingRef.current = false
      setError(''); commit()
    } catch { formattingRef.current = false; setError(t(`${TK}.unsupported`)) }
  }

  const moveHistory = (direction: number) => {
    if (disabled || !editorRef.current) return
    const index = history.current.index + direction
    if (index < 0 || index >= history.current.entries.length) return
    history.current.index = index
    const next = history.current.entries[index]
    editorRef.current.innerHTML = next
    selectionRef.current = null
    onHtmlChange(next)
    setRevision((value) => value + 1)
    restoreSelection()
  }

  const tools = [
    { command: 'bold', label: 'bold', Icon: Bold }, { command: 'italic', label: 'italic', Icon: Italic },
    { command: 'underline', label: 'underline', Icon: Underline },
    { command: 'insertOrderedList', label: 'orderedList', Icon: ListOrdered }, { command: 'insertUnorderedList', label: 'bulletList', Icon: List },
  ]
  return (
    <div className="mt-1.5 min-w-0 max-w-full">
      <div role="toolbar" aria-label={t(`${TK}.toolbar`)} className="flex flex-wrap items-center gap-1 rounded-t-lg border border-nexoraBorder bg-white p-1">
        <select disabled={disabled} aria-label={t(`${TK}.textStyle`)} value={block} onBlur={saveSelection} onChange={(event) => command('formatBlock', event.target.value)} className="min-h-11 max-w-full rounded-lg bg-white px-3 text-xs font-bold text-nexoraText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
          {['p', 'h1', 'h2', 'h3'].map((value) => <option key={value} value={value}>{t(`${TK}.styles.${value}`)}</option>)}
        </select>
        {tools.slice(0, 3).map(({ command: name, label, Icon }) => <button key={name} type="button" aria-label={t(`${TK}.${label}`)} title={t(`${TK}.${label}`)} aria-pressed={Boolean(states[name])} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)} className={`${controlClass} ${states[name] ? 'bg-nexoraBrandSoft text-nexoraBrand' : ''}`}><Icon className="h-4 w-4" aria-hidden /></button>)}
        <button type="button" aria-label={t(`${TK}.link`)} title={t(`${TK}.link`)} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLinkOpen((current) => !current); setError('') }} className={controlClass}><Link className="h-4 w-4" aria-hidden /></button>
        {tools.slice(3).map(({ command: name, label, Icon }) => <button key={name} type="button" aria-label={t(`${TK}.${label}`)} title={t(`${TK}.${label}`)} aria-pressed={Boolean(states[name])} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)} className={`${controlClass} ${states[name] ? 'bg-nexoraBrandSoft text-nexoraBrand' : ''}`}><Icon className="h-4 w-4" aria-hidden /></button>)}
        <button type="button" aria-label={t(`${TK}.clear`)} title={t(`${TK}.clear`)} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={clearFormatting} className={controlClass}><RemoveFormatting className="h-4 w-4" aria-hidden /></button>
      </div>
      {linkOpen ? <div className="flex flex-wrap items-end gap-2 border-x border-nexoraBorder bg-nexoraSurfaceMuted p-3"><label className="min-w-0 flex-1 text-xs font-bold text-nexoraText">{t(`${TK}.linkUrl`)}<input type="url" disabled={disabled} value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-nexoraBrandSoft" /></label><button type="button" disabled={disabled} onClick={() => { const href = safePostingLink(linkUrl); if (!href) { setError(t(`${TK}.invalidLink`)); return }; command('createLink', href); setLinkOpen(false); setLinkUrl('') }} className={`${controlClass} text-xs font-bold text-nexoraBrand`}>{t(`${TK}.applyLink`)}</button></div> : null}
      <div ref={editorRef} id="recruitment-field-body" role="textbox" aria-multiline="true" aria-labelledby="recruitment-content-body-label" aria-invalid={invalid} aria-disabled={disabled} contentEditable={!disabled} suppressContentEditableWarning onInput={() => { if (!formattingRef.current) commit() }} onMouseUp={saveSelection} onKeyUp={saveSelection} onBlur={saveSelection} onDrop={(event) => event.preventDefault()} onPaste={(event) => { event.preventDefault(); if (disabled) return; saveSelection(); command('insertHTML', sanitizePostingHtml(event.clipboardData.getData('text/html') || postingHtmlFromText(event.clipboardData.getData('text/plain')))) }} className={`h-60 min-h-[240px] max-h-[360px] min-w-0 w-full max-w-full overflow-y-auto [overflow-wrap:anywhere] rounded-b-lg border border-t-0 bg-white px-3 py-3 text-sm leading-7 text-nexoraText outline-none focus:ring-2 focus:ring-nexoraBrandSoft [&_a]:text-nexoraBrand [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 ${disabled ? 'bg-slate-100' : ''} ${invalid ? 'border-rose-400' : 'border-nexoraBorder'}`} />
      <p className="mt-3 text-xs italic leading-5 text-nexoraMuted">{t(`${TK}.aiDisclaimer`)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-nexoraSurfaceMuted"><button type="button" aria-label={t(`${TK}.undo`)} title={t(`${TK}.undo`)} disabled={disabled || history.current.index === 0} onClick={() => moveHistory(-1)} className={controlClass}><Undo2 className="h-4 w-4" aria-hidden /></button><button type="button" aria-label={t(`${TK}.redo`)} title={t(`${TK}.redo`)} disabled={disabled || history.current.index === history.current.entries.length - 1} onClick={() => moveHistory(1)} className={controlClass}><Redo2 className="h-4 w-4" aria-hidden /></button></div>
        <button type="button" disabled={disabled} onClick={() => { if (!disabled) onUseAI() }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrandSoft px-4 text-xs font-bold text-nexoraBrand hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-40"><Wand2 className="h-4 w-4" aria-hidden />{t(`${TK}.writeAI`)}</button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  )
}
