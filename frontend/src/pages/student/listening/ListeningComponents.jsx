import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AudioPlayer({
  src,
  label,
  audioId,
  playingId,
  playingLabel,
  onPlay,
  onPause,
}) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const fmt = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '00')}`

  useEffect(() => {
    if (playingId !== audioId && playing) {
      audioRef.current?.pause()
      setPlaying(false)
    }
  }, [playingId])

  const isBlocked = playingId !== null && playingId !== audioId

  const handleBlocked = () => {
    toast.warning(`Pause ${playingLabel} first before playing this audio.`, {
      id: 'audio-blocked',
      duration: 3000,
      icon: null,
    })
  }

  const toggle = () => {
    if (!audioRef.current) return
    if (isBlocked) {
      handleBlocked()
      return
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      onPause()
    } else {
      audioRef.current.play()
      setPlaying(true)
      onPlay(audioId)
    }
  }

  const restart = () => {
    if (!audioRef.current) return
    if (isBlocked) {
      handleBlocked()
      return
    }
    audioRef.current.currentTime = 0
    audioRef.current.play()
    setPlaying(true)
    onPlay(audioId)
  }

  const seek = (e) => {
    if (!audioRef.current || !duration || isBlocked) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  return (
    <div
      className={`rounded-2xl border-2 p-4 mb-4 shadow-[3px_3px_0px_#151313] transition-all duration-200 ${
        isBlocked
          ? 'bg-[#2a2a2a] border-[#151313]/50 opacity-50'
          : 'bg-[#151313] border-[#151313]'
      }`}
    >
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            setPlaying(false)
            onPause()
          }}
        />
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            disabled={!src}
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-white transition-colors disabled:opacity-40 ${
              isBlocked
                ? 'bg-white/10 border-white/10 cursor-not-allowed'
                : 'bg-[#E9424C] border-[#E9424C] hover:bg-[#c73540] cursor-pointer'
            }`}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={restart}
            disabled={!src}
            className="w-7 h-7 rounded-xl border-2 border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        <div className="flex-1">
          {label && (
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
              {label}
            </p>
          )}
          <div
            className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={seek}
          >
            <div
              className="h-full bg-[#E9424C] rounded-full transition-all duration-100"
              style={{
                width: duration ? `${(progress / duration) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Volume2
            size={11}
            className={playing ? 'text-[#E9424C]' : 'text-white/30'}
          />
          <span className="text-[10px] font-black text-white/40 tabular-nums">
            {fmt(progress)} / {fmt(duration)}
          </span>
        </div>
      </div>

      {!src && (
        <p className="text-[10px] text-white/30 font-medium mt-2 text-center">
          No audio available for this part
        </p>
      )}
    </div>
  )
}

export function QuestionCard({ q, answers, onSelect, disabled }) {
  const isImage = (val) =>
    typeof val === 'string' && /\.(png|jpg|jpeg|gif|svg|webp)/i.test(val)
  const hasImageOptions = q.options && Object.values(q.options).some(isImage)

  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]">
      <p className="text-sm font-black text-[#151313] mb-4 text-justify">
        <span className="text-[#E9424C] mr-2">{q.question_number}.</span>
        {q.question_text}
      </p>

      {hasImageOptions ? (
        <div className="grid grid-cols-1 gap-3 max-w-sm">
          {Object.entries(q.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onSelect(q.id, key)}
              disabled={disabled}
              className={`flex flex-col rounded-xl border-2 transition-all duration-150 overflow-hidden ${
                answers[q.id] === key
                  ? 'border-[#E9424C] shadow-[2px_2px_0px_#E9424C]'
                  : 'border-[#151313]/20 hover:border-[#151313]'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 ${
                  answers[q.id] === key
                    ? 'bg-[#E9424C] border-[#E9424C]'
                    : 'bg-[#f7f7f5] border-[#151313]/10'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${
                    answers[q.id] === key
                      ? 'border-white text-white'
                      : 'border-[#151313] text-[#151313]'
                  }`}
                >
                  {key}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    answers[q.id] === key ? 'text-white' : 'text-[#151313]/40'
                  }`}
                >
                  Option {key}
                </span>
              </div>
              <img
                src={value}
                alt={`Option ${key}`}
                className="w-full h-auto object-contain max-h-40"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(q.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onSelect(q.id, key)}
              disabled={disabled}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                answers[q.id] === key
                  ? 'bg-[#E9424C] text-white border-[#151313] shadow-[2px_2px_0px_#151313]'
                  : 'border-[#151313]/20 text-[#151313] hover:border-[#151313] hover:bg-[#f7f7f5]'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <span className="font-black mr-2">{key}.</span>
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Part3OptionsBox({ options, optionsTitle }) {
  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#151313] mb-4">
      <div className="px-4 py-3 bg-[#151313]">
        <p className="text-sm font-black text-white">
          {optionsTitle || 'Options'}
        </p>
      </div>
      <div className="p-4 space-y-2">
        {Object.entries(options).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-3 text-sm text-[#151313]"
          >
            <span className="w-6 h-6 rounded-full border-2 border-[#151313] flex items-center justify-center text-xs font-black shrink-0">
              {key}
            </span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchingQuestionCard({ q, answers, onSelect, disabled }) {
  const options = q.options || {}
  const selected = answers[q.id]
  const speakerName = q.question_text || `Q${q.question_number}`

  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl px-5 py-4 shadow-[3px_3px_0px_#151313] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-black text-[#E9424C] shrink-0">
          {q.question_number}.
        </span>
        <span className="text-sm font-black text-[#151313] truncate">
          {speakerName}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={disabled}
            className={`inline-flex items-center gap-2 text-xs font-black px-3 py-2 rounded-xl border-2 transition-colors focus:outline-none shrink-0 ${
              selected
                ? 'border-[#E9424C] text-[#E9424C] bg-[#E9424C]/5'
                : 'border-[#151313]/30 text-[#151313]/50 bg-white hover:border-[#151313]'
            } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {selected ? (
              <>
                <span className="font-black">{selected}.</span>{' '}
                {options[selected]}
              </>
            ) : (
              'Select answer'
            )}
            <ChevronDown size={12} />
          </button>
        </DropdownMenuTrigger>
        {!disabled && (
          <DropdownMenuContent align="end" className="min-w-48">
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
            {Object.entries(options).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                className={`text-xs font-black cursor-pointer ${selected === key ? 'text-[#E9424C]' : ''}`}
                onClick={() => onSelect(q.id, key)}
              >
                <span className="font-black mr-2">{key}.</span> {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}

export function PartSection({
  partNumber,
  partTitle,
  passage,
  audioUrl,
  questions,
  answers,
  onSelect,
  disabled,
  playingId,
  playingLabel,
  onPlay,
  onPause,
}) {
  const isPart5 = partNumber === 5
  const isPart3 = partNumber === 3
  const passageData = (() => {
    if (!passage) return null
    if (typeof passage === 'object') return passage
    try {
      return JSON.parse(passage)
    } catch {
      return null
    }
  })()

  const part5Groups = isPart5
    ? (() => {
        const groups = []
        let cur = null
        for (const q of questions) {
          const url = q.audio_url || null
          if (!cur || cur.audio !== url) {
            const idx = groups.length + 1
            cur = {
              dialogueLabel: `Dialogue ${idx}`,
              instruction: q.passage_title || null,
              audio: url,
              qs: [],
            }
            groups.push(cur)
          }
          cur.qs.push(q)
        }
        return groups
      })()
    : null

  return (
    <div>
      <div className="mb-4">
        <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
          Part {partNumber}
        </span>
        {partTitle && (
          <p className="text-xs font-semibold text-[#151313]/60 leading-relaxed mt-1 italic">
            {partTitle}
          </p>
        )}
      </div>

      {isPart3 && questions[0]?.options && (
        <Part3OptionsBox
          options={questions[0].options}
          optionsTitle={passageData?.options_title}
        />
      )}

      {!isPart5 && audioUrl && (
        <AudioPlayer
          src={audioUrl}
          label={null}
          audioId={`part-${partNumber}`}
          playingId={playingId}
          playingLabel={playingLabel}
          onPlay={onPlay}
          onPause={onPause}
        />
      )}

      {isPart5 ? (
        <div className="space-y-10">
          {part5Groups.map((group, idx) => (
            <div key={idx}>
              <div className="mb-3">
                <span className="inline-block bg-[#E9424C] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                  {group.dialogueLabel}
                </span>
                {group.instruction && (
                  <p className="text-xs font-semibold text-[#151313]/60 leading-relaxed italic">
                    {group.instruction}
                  </p>
                )}
              </div>
              <AudioPlayer
                src={group.audio}
                label={null}
                audioId={`part-5-conv-${idx + 1}`}
                playingId={playingId}
                playingLabel={playingLabel}
                onPlay={onPlay}
                onPause={onPause}
              />
              <div className="space-y-4">
                {group.qs.map((q) => (
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
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {isPart3 && passageData?.answer_label && (
            <div className="flex items-center gap-2 px-1 pb-1">
              <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                {passageData.answer_label}
              </span>
            </div>
          )}
          {questions.map((q) =>
            isPart3 ? (
              <MatchingQuestionCard
                key={q.id}
                q={q}
                answers={answers}
                onSelect={onSelect}
                disabled={disabled}
              />
            ) : (
              <QuestionCard
                key={q.id}
                q={q}
                answers={answers}
                onSelect={onSelect}
                disabled={disabled}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
