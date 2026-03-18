import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const box =
  'bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]'

export function NumberedParagraphs({ paragraphs }) {
  return (
    <div className="space-y-3">
      {paragraphs.map((para, idx) => (
        <div key={para.number} className="flex gap-4">
          <span className="text-xs font-black text-[#151313] shrink-0 w-4 pt-0.5">
            {para.number}
          </span>
          <p
            className="text-sm text-[#151313] leading-relaxed font-medium flex-1 text-justify"
            style={{ textIndent: idx === 0 ? '0' : '1.5em' }}
          >
            {para.text}
          </p>
        </div>
      ))}
    </div>
  )
}

export function ThreeColumnPassage({ data }) {
  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl overflow-hidden mb-5 shadow-[3px_3px_0px_#151313]">
      <div className="grid grid-cols-3 divide-x-2 divide-[#151313]">
        {data.columns.map((col) => (
          <div key={col.label} className="p-4 flex flex-col gap-2">
            <div className="text-center">
              <span className="text-xs font-black text-[#151313] border-2 border-[#151313] px-2 py-0.5 rounded-md">
                {col.label}
              </span>
            </div>
            <p className="text-xs font-black text-[#151313] text-center">
              {col.title}
            </p>
            <p className="text-xs text-[#151313] leading-relaxed font-medium text-justify">
              {col.body}
            </p>
            <div className="text-xs text-[#151313] font-medium whitespace-pre-line border-t border-[#151313]/20 pt-2">
              {col.details}
            </div>
            <p className="text-xs text-[#151313] italic font-medium mt-auto pt-2 text-justify">
              {col.footer}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmailPassage({ passage }) {
  const lines = passage.split('\n')
  const headerLines = []
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    if (['To:', 'From:', 'Subject:'].some((p) => lines[i].startsWith(p))) {
      headerLines.push(lines[i])
      bodyStart = i + 1
    } else if (headerLines.length > 0) {
      bodyStart = i
      break
    }
  }
  const sections = lines
    .slice(bodyStart)
    .join('\n')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const m = line.trim().match(/^(\d+)\s+(.*)/)
      return m
        ? { type: 'para', number: m[1], text: m[2] }
        : { type: 'plain', text: line.trim() }
    })
  let paraCount = 0
  return (
    <div className={`${box} mb-5`}>
      <div className="space-y-1 mb-4 pb-4 border-b-2 border-[#151313]/10">
        {headerLines.map((line, i) => {
          const ci = line.indexOf(':'),
            label = line.substring(0, ci),
            value = line.substring(ci + 1).trim()
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="font-black text-[#151313] shrink-0">
                {label}:
              </span>
              <span
                className={`font-medium text-[#151313] ${label === 'To' || label === 'From' ? 'underline underline-offset-2' : ''}`}
              >
                {value}
              </span>
            </div>
          )
        })}
      </div>
      <div className="space-y-3">
        {sections.map((s, i) =>
          s.type === 'para' ? (
            <div key={i} className="flex gap-4">
              <span className="text-xs font-black text-[#151313] shrink-0 w-4 pt-0.5">
                {s.number}
              </span>
              <p
                className="text-sm text-[#151313] leading-relaxed font-medium flex-1 text-justify"
                style={{ textIndent: paraCount++ === 0 ? '0' : '1.5em' }}
              >
                {s.text}
              </p>
            </div>
          ) : (
            <p key={i} className="text-sm text-[#151313] font-medium">
              {s.text}
            </p>
          )
        )}
      </div>
    </div>
  )
}

export function ShortStoryPassage({ passage }) {
  let n = 0
  const parsed = passage
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+)\s+(.*)/)
      return m ? { number: m[1], text: m[2] } : { number: '', text: line }
    })
  return (
    <div className={`${box} mb-5`}>
      <div className="space-y-2">
        {parsed.map((line, i) => {
          const isNum = line.number !== ''
          const indent = isNum && n > 0 ? '1.5em' : '0'
          if (isNum) n++
          return (
            <div key={i} className="flex gap-4">
              <span className="text-xs font-black text-[#151313] shrink-0 w-4 pt-0.5">
                {line.number}
              </span>
              <p
                className="text-sm text-[#151313] leading-relaxed font-medium flex-1 text-justify"
                style={{ textIndent: indent }}
              >
                {line.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LabeledTextPassage({ data }) {
  return (
    <div className={`${box} mb-4`}>
      <p className="text-sm font-black text-[#151313] mb-4">{data.label}</p>
      <NumberedParagraphs paragraphs={data.paragraphs} />
    </div>
  )
}

export function TwoTextsPassage({ data }) {
  return (
    <div className="mb-4 space-y-4">
      {data.texts.map((text) => (
        <div key={text.label} className={box}>
          <p className="text-sm font-black text-[#151313] mb-4">{text.label}</p>
          <NumberedParagraphs paragraphs={text.paragraphs} />
        </div>
      ))}
    </div>
  )
}

export function GappedTextPassage({
  data,
  gapQuestions,
  answers,
  onSelect,
  disabled,
}) {
  const gapMap = Object.fromEntries(
    gapQuestions.map((q) => [q.question_number, q])
  )
  const opts = data.sentences.map((s) => s.key)
  const renderPara = (text) =>
    text.split(/(\d{2}\s*_+)/g).map((part, i) => {
      const m = part.match(/^(\d{2})\s*_+/)
      if (!m) return <span key={i}>{part}</span>
      const q = gapMap[parseInt(m[1])]
      if (!q) return <span key={i}>{part}</span>
      const selected = answers[q.id]
      return (
        <span key={i} className="inline-flex items-center mx-1 align-middle">
          <span className="text-xs font-black text-[#151313]/50 mr-1">
            {m[1]}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 h-auto rounded-lg border-2 ${
                  selected
                    ? 'border-[#E9424C] text-[#E9424C] bg-[#E9424C]/5 hover:bg-[#E9424C]/10'
                    : 'border-[#151313]/30 text-[#151313]/50 bg-white hover:border-[#151313] hover:text-[#151313]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {selected || '___'}
                <ChevronDown size={10} />
              </Button>
            </DropdownMenuTrigger>
            {!disabled && (
              <DropdownMenuContent align="start" className="min-w-20">
                {selected && (
                  <>
                    <DropdownMenuItem
                      className="text-xs text-[#151313]/40 cursor-pointer"
                      onClick={() => onSelect(q.id, null)}
                    >
                      — clear —
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {opts.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    className={`text-xs font-black cursor-pointer ${selected === opt ? 'text-[#E9424C]' : ''}`}
                    onClick={() => onSelect(q.id, opt)}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </span>
      )
    })
  return (
    <div className="mb-2 space-y-4">
      <div className={box}>
        <div className="space-y-1">
          {data.main_text.split('\n\n').map((para, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-xs font-black text-[#151313] shrink-0 w-4 pt-0.5">
                {para.match(/^(\d+)/)?.[1] || ''}
              </span>
              <p className="text-sm text-[#151313] leading-relaxed font-medium flex-1 text-justify">
                {renderPara(para.replace(/^\d+\t/, ''))}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className={box}>
        <p className="text-xs font-black text-[#151313]/40 uppercase tracking-widest mb-4">
          Sentences A to G — one extra sentence you do not need to use
        </p>
        <div className="space-y-3">
          {data.sentences.map((s) => (
            <div key={s.key} className="flex gap-4 text-sm text-[#151313]">
              <span className="font-black shrink-0 w-4">{s.key}</span>
              <span className="font-medium leading-relaxed text-justify flex-1">
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LinedTextPassage({ data }) {
  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 mb-5 shadow-[3px_3px_0px_#151313]">
      <div className="space-y-4">
        {data.paragraphs.map((para, idx) => (
          <div key={para.number} className="flex gap-4 items-start">
            <span className="text-xs font-black text-[#151313] shrink-0 w-4 pt-0.5">
              {para.number}
            </span>
            <p
              className="text-sm text-[#151313] leading-relaxed font-medium flex-1 text-justify"
              style={{ textIndent: idx === 0 ? '0' : '1.5em' }}
            >
              {para.text}
            </p>
            <span className="text-[10px] font-black text-[#151313]/40 shrink-0 w-8 text-right pt-0.5 whitespace-nowrap">
              {para.lines}
            </span>
          </div>
        ))}
      </div>
      {data.citation && (
        <p className="text-xs text-[#151313]/60 mt-4 pt-2 border-t border-[#151313]/10">
          {data.citation}
        </p>
      )}
    </div>
  )
}

export function PassageRenderer({
  passage,
  partNumber,
  gapQuestions,
  answers,
  onSelect,
  disabled,
}) {
  if (!passage) return null
  let parsed = null
  try {
    parsed = JSON.parse(passage)
  } catch {
    if (partNumber === 2) return <EmailPassage passage={passage} />
    if (partNumber === 3) return <ShortStoryPassage passage={passage} />
    return (
      <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 mb-5 shadow-[3px_3px_0px_#151313]">
        <p className="text-sm text-[#151313] leading-relaxed font-medium text-justify whitespace-pre-wrap">
          {passage}
        </p>
      </div>
    )
  }
  if (parsed.type === 'three_column_table')
    return <ThreeColumnPassage data={parsed} />
  if (parsed.type === 'numbered_paragraphs')
    return <LabeledTextPassage data={parsed} />
  if (parsed.type === 'two_texts') return <TwoTextsPassage data={parsed} />
  if (parsed.type === 'gapped_text')
    return (
      <GappedTextPassage
        data={parsed}
        gapQuestions={gapQuestions}
        answers={answers}
        onSelect={onSelect}
        disabled={disabled}
      />
    )
  if (parsed.type === 'lined_text') return <LinedTextPassage data={parsed} />
  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 mb-5 shadow-[3px_3px_0px_#151313]">
      <p className="text-sm text-[#151313] leading-relaxed font-medium text-justify">
        {passage}
      </p>
    </div>
  )
}

export function QuestionCard({ q, answers, onSelect, disabled }) {
  return (
    <div className={box}>
      <p className="text-sm font-black text-[#151313] mb-4 text-justify">
        <span className="text-[#E9424C] mr-2">{q.question_number}.</span>
        {q.question_text}
      </p>
      <div className="space-y-2">
        {Object.entries(q.options).map(([key, value]) => (
          <Button
            key={key}
            variant="outline"
            onClick={() => onSelect(q.id, key)}
            disabled={disabled}
            className={`w-full justify-start px-4 py-3 h-auto rounded-xl border-2 text-sm font-semibold whitespace-normal break-words text-left ${
              answers[q.id] === key
                ? 'bg-[#E9424C] text-white border-[#151313] shadow-[2px_2px_0px_#151313] hover:bg-[#E9424C]/90'
                : 'border-[#151313]/20 text-[#151313] hover:border-[#151313] hover:bg-[#f7f7f5]'
            }`}
          >
            <span className="font-black mr-2 shrink-0">{key}.</span>
            <span className="flex-1">{value}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function Part4Section({ groups, answers, onSelect, disabled }) {
  let twoTexts = null
  try {
    const parsed = JSON.parse(groups[0]?.passage)
    if (parsed?.type === 'two_texts') twoTexts = parsed
  } catch {}

  if (!twoTexts) {
    return (
      <div>
        <div className="mb-4">
          <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
            Part 4
          </span>
        </div>

        {groups.map((group) => {
          const pType = (() => {
            try {
              return JSON.parse(group.passage)?.type
            } catch {
              return null
            }
          })()

          const instruction = group.passageTitle || ''

          return (
            <div key={group.key} className="mb-8">
              {instruction && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#151313]/60 leading-relaxed text-justify">
                    {instruction}
                  </p>
                </div>
              )}

              {pType !== 'two_texts' && (
                <PassageRenderer
                  passage={group.passage}
                  partNumber={4}
                  gapQuestions={group.questions}
                  answers={answers}
                  onSelect={onSelect}
                  disabled={disabled}
                />
              )}
              <div className="space-y-4">
                {group.questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    answers={answers}
                    onSelect={onSelect}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
          Part 4
        </span>
        <p className="text-xs font-semibold text-[#151313]/60 leading-relaxed mt-1 text-justify">
          {groups[0]?.passageTitle?.split('.')[0] + '.'}
        </p>
      </div>

      {groups.map((group, groupIdx) => {
        const sub = group.passageTitle?.split(/\.\s+/).slice(1).join('. ')

        return (
          <div key={group.key} className="mb-8">
            {groupIdx === 0 && twoTexts.texts[0] && (
              <div className={`${box} mb-4`}>
                <p className="text-sm font-black text-[#151313] mb-4">
                  {twoTexts.texts[0].label}
                </p>
                <NumberedParagraphs paragraphs={twoTexts.texts[0].paragraphs} />
              </div>
            )}

            {groupIdx === 1 && twoTexts.texts[1] && (
              <div className={`${box} mb-4`}>
                <p className="text-sm font-black text-[#151313] mb-4">
                  {twoTexts.texts[1].label}
                </p>
                <NumberedParagraphs paragraphs={twoTexts.texts[1].paragraphs} />
              </div>
            )}

            {sub && (
              <p className="text-xs font-semibold text-[#151313]/60 italic mb-3">
                {sub}
              </p>
            )}

            <div className="space-y-4">
              {group.questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  answers={answers}
                  onSelect={onSelect}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function groupByPartAndPassage(questions) {
  const groups = []
  let cur = null
  for (const q of questions) {
    const key = `${q.part_number}__${q.passage}`
    if (!cur || cur.key !== key) {
      cur = {
        key,
        partNumber: q.part_number,
        passageTitle: q.passage_title,
        passage: q.passage,
        questions: [],
      }
      groups.push(cur)
    }
    cur.questions.push(q)
  }
  return groups
}
