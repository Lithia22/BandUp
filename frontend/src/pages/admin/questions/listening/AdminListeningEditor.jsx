import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  ArrowUp,
  ArrowDown,
  X,
  Music,
  Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import api from '../../../../services/api'
import { toast } from 'sonner'
import { QuestionCardSkeleton } from '../../../../components/layouts/Skeletons'
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'

const PART_CONFIG = {
  1: { questions: 7, startQ: 1, label: 'Short Dialogue' },
  2: { questions: 7, startQ: 8, label: 'Monologue' },
  3: { questions: 3, startQ: 15, label: 'Multiple Speakers' },
  4: { questions: 7, startQ: 18, label: 'Long Dialogue' },
  5: { questions: 6, startQ: 25, label: 'Short Dialogues' },
}

const defaultOptions = (part) => {
  if (part === 3) return { A: '', B: '', C: '', D: '', E: '' }
  return { A: '', B: '', C: '' }
}
const defaultImageOptions = () => ({ A: '', B: '', C: '' })

async function uploadViaBackend(file, bucket, path) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  formData.append('path', path)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const token = localStorage.getItem('bandup_token')
  const res = await fetch(`${apiUrl}/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Upload failed (${res.status})`)
  }
  return (await res.json()).url
}

function AudioUploader({ label, value, onChange, uploadPath }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const url = await uploadViaBackend(
        file,
        'audio',
        `listening/${uploadPath}.${ext}`
      )
      onChange(url)
      toast.success('Audio uploaded')
    } catch (e) {
      toast.error('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
          {label}
        </Label>
      )}
      {value ? (
        <div className="border-2 border-[#22c55e] bg-[#22c55e]/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#151313] flex items-center justify-center shrink-0">
            <Music size={14} className="text-white" />
          </div>
          <audio src={value} controls className="h-8 flex-1 min-w-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="w-7 h-7 p-0 text-[#E9424C] hover:text-[#E9424C] shrink-0"
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#151313] transition-colors ${uploading ? 'border-[#151313]/50 opacity-60' : 'border-[#151313]/30'}`}
          onClick={() => !uploading && ref.current?.click()}
        >
          <Music size={20} className="text-[#151313]/30" />
          <p className="text-xs text-[#151313]/40 font-medium">
            {uploading ? 'Uploading...' : 'Click to upload audio'}
          </p>
          <input
            ref={ref}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}
    </div>
  )
}

function ImageOptionUploader({ optKey, value, onChange, setNum, year, qNum }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `listening/listening_s${setNum}_q${qNum}_${year}_${optKey.toLowerCase()}.${ext}`
      const url = await uploadViaBackend(file, 'images', path)
      onChange(url)
      toast.success(`Option ${optKey} image uploaded`)
    } catch (e) {
      toast.error('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`border-2 rounded-xl p-2 flex flex-col items-center gap-2 min-h-[100px] justify-center cursor-pointer transition-all ${value ? 'border-[#22c55e]' : 'border-[#151313]/30 border-dashed hover:border-[#151313]'}`}
      onClick={() => !uploading && ref.current?.click()}
    >
      {value ? (
        <div className="relative w-full">
          <img
            src={value}
            alt={`Option ${optKey}`}
            className="w-full h-24 object-contain rounded-lg"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="absolute top-0 right-0 w-5 h-5 p-0 text-[#E9424C] bg-white rounded-full border border-[#E9424C]"
          >
            <X size={10} />
          </Button>
        </div>
      ) : (
        <>
          <Image size={20} className="text-[#151313]/30" />
          <p className="text-[10px] text-[#151313]/40 font-medium">
            {uploading ? 'Uploading...' : 'Click to upload'}
          </p>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}

export default function AdminListeningEditor() {
  const navigate = useNavigate()
  const { setNumber } = useParams()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')
  const isMounted = useRef(true)
  const isSaving = useRef(false)
  const firstLoad = useRef(true)
  const sessionDraftId = useRef(
    draftId || `listening_draft_${setNumber || 'new'}`
  )

  const [selectedPart, setSelectedPart] = useState(1)
  const [allQuestions, setAllQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [setExistsError, setSetExistsError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [year, setYear] = useState(new Date().getFullYear())
  const [editableSetNumber, setEditableSetNumber] = useState(setNumber || '')
  const [audioMap, setAudioMap] = useState({})
  const [part5Dialogues, setPart5Dialogues] = useState([
    { audio: '', instruction: '' },
    { audio: '', instruction: '' },
    { audio: '', instruction: '' },
  ])
  const [part3SharedOptions, setPart3SharedOptions] = useState({
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  })
  const [instructionMap, setInstructionMap] = useState({})

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const currentPartQs = allQuestions
    .filter((q) => q.part_number === selectedPart)
    .sort((a, b) => a.question_number - b.question_number)

  useEffect(() => {
    if (firstLoad.current) return
    setUnsavedChanges(true)
  }, [
    allQuestions,
    audioMap,
    part5Dialogues,
    part3SharedOptions,
    instructionMap,
    year,
    editableSetNumber,
  ])

  const [defaultGenerated, setDefaultGenerated] = useState(false)

useEffect(() => {
  if (setNumber) return
  if (draftId) return
  if (loading) return
  if (defaultGenerated) return

  const existingPartQs = allQuestions.filter(
    (q) => q.part_number === selectedPart
  )

  if (existingPartQs.length === 0) {
    const { questions: count, startQ } = PART_CONFIG[selectedPart]

    setAllQuestions((prev) => {
      const withoutCurrentPart = prev.filter(
        (q) => q.part_number !== selectedPart
      )

      const newQs = Array.from({ length: count }, (_, i) => ({
        question_number: startQ + i,
        question_text: '',
        options: defaultOptions(selectedPart),
        correct_answer: '',
        part_number: selectedPart,
        has_image_options: false,
      }))

      return [...withoutCurrentPart, ...newQs]
    })

    setDefaultGenerated(true)
  }
}, [selectedPart, loading, setNumber, draftId, defaultGenerated, allQuestions])

  const autoSave = useCallback(() => {
    if (setNumber || allQuestions.length === 0) return
    try {
      localStorage.setItem(
        `listening_admin_draft_${sessionDraftId.current}`,
        JSON.stringify({
          allQuestions,
          audioMap,
          part5Dialogues,
          part3SharedOptions,
          instructionMap,
          selectedPart,
          year,
          editableSetNumber,
          timestamp: Date.now(),
        })
      )
    } catch {}
  }, [
    allQuestions,
    audioMap,
    part5Dialogues,
    part3SharedOptions,
    instructionMap,
    selectedPart,
    year,
    editableSetNumber,
    setNumber,
  ])

  useEffect(() => {
    if (setNumber) return
    const timer = setTimeout(autoSave, 1500)
    const interval = setInterval(autoSave, 5000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [autoSave])

  const loadSet = async (setNum) => {
    setLoading(true)
    try {
      const res = await api.get(`/listening/sets/${setNum}`)
      if (!isMounted.current) return
      const questions = res.data.questions
      if (!questions.length) return

      setYear(questions[0].year || new Date().getFullYear())
      setEditableSetNumber(setNum)

      setAllQuestions(
        questions.map((q) => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text || '',
          options: q.options || defaultOptions(q.part_number),
          correct_answer: q.correct_answer
            ? String(q.correct_answer).trim()
            : '',
          part_number: q.part_number,
          has_image_options:
            q.options &&
            Object.values(q.options).some(
              (v) =>
                typeof v === 'string' &&
                /\.(png|jpg|jpeg|gif|svg|webp)/i.test(v)
            ),
        }))
      )

      const newAudioMap = {}
      const newInstructionMap = {}
      for (const part of [1, 2, 3, 4]) {
        const q = questions.find((x) => x.part_number === part)
        if (q?.audio_url) newAudioMap[part] = q.audio_url
        if (q?.passage_title) newInstructionMap[part] = q.passage_title
      }
      setAudioMap(newAudioMap)
      setInstructionMap(newInstructionMap)

      const p3q = questions.find((q) => q.part_number === 3)
      if (p3q?.options)
        setPart3SharedOptions({
          A: '',
          B: '',
          C: '',
          D: '',
          E: '',
          ...p3q.options,
        })

      const p5qs = questions
        .filter((q) => q.part_number === 5)
        .sort((a, b) => a.question_number - b.question_number)
      const dialogues = [
        { audio: '', instruction: '' },
        { audio: '', instruction: '' },
        { audio: '', instruction: '' },
      ]
      const groups = [
        [p5qs[0], p5qs[1]],
        [p5qs[2], p5qs[3]],
        [p5qs[4], p5qs[5]],
      ]
      groups.forEach((group, i) => {
        const first = group.find(Boolean)
        if (first) {
          dialogues[i].audio = first.audio_url || ''
          dialogues[i].instruction = first.passage_title || ''
        }
      })
      setPart5Dialogues(dialogues)
    } catch {
      if (isMounted.current) toast.error('Failed to load set')
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setUnsavedChanges(false)
        firstLoad.current = false
      }
    }
  }

  const loadDraft = (id) => {
    try {
      const saved = localStorage.getItem(`listening_admin_draft_${id}`)
      if (!saved) return
      const d = JSON.parse(saved)
      setAllQuestions(d.allQuestions || [])
      setAudioMap(d.audioMap || {})
      setPart5Dialogues(
        d.part5Dialogues || [
          { audio: '', instruction: '' },
          { audio: '', instruction: '' },
          { audio: '', instruction: '' },
        ]
      )
      setPart3SharedOptions(
        d.part3SharedOptions || { A: '', B: '', C: '', D: '', E: '' }
      )
      setInstructionMap(d.instructionMap || {})
      setSelectedPart(d.selectedPart || 1)
      setYear(d.year || new Date().getFullYear())
      setEditableSetNumber(d.editableSetNumber || '')
    } catch {}
    firstLoad.current = false
  }

  useEffect(() => {
    if (setNumber) {
      loadSet(setNumber)
      setEditableSetNumber(setNumber)
    } else if (draftId) {
      loadDraft(draftId)
    } else {
      loadDraft(sessionDraftId.current)
    }
  }, [setNumber, draftId])

  useEffect(() => {
    const check = async () => {
      if (!editableSetNumber || !year) {
        setSetExistsError('')
        return
      }
      if (setNumber && String(editableSetNumber) === String(setNumber)) {
        setSetExistsError('')
        return
      }
      try {
        const res = await api.get('/listening/sets')
        const exists = res.data.sets?.some(
          (s) =>
            s.set_number === parseInt(editableSetNumber) &&
            s.year === parseInt(year)
        )
        setSetExistsError(
          exists ? `Set ${editableSetNumber} (${year}) already exists` : ''
        )
      } catch {}
    }
    check()
  }, [editableSetNumber, year, setNumber])

  const onText = (qNum, val) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.part_number === selectedPart && q.question_number === qNum
          ? { ...q, question_text: val }
          : q
      )
    )
    setFieldErrors((p) => {
      const n = { ...p }
      delete n[`q${qNum}_text`]
      return n
    })
  }

  const onOption = (qNum, key, val) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.part_number === selectedPart && q.question_number === qNum
          ? { ...q, options: { ...q.options, [key]: val } }
          : q
      )
    )
  }

  const onCorrect = (qNum, val) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.part_number === selectedPart && q.question_number === qNum
          ? { ...q, correct_answer: val }
          : q
      )
    )
  }

  const onMove = (idx, dir) => {
    const qs = [...currentPartQs]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= qs.length) return
    ;[qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]]
    const startQ = PART_CONFIG[selectedPart].startQ
    qs.forEach((q, i) => {
      q.question_number = startQ + i
    })
    setAllQuestions((prev) => [
      ...prev.filter((q) => q.part_number !== selectedPart),
      ...qs,
    ])
  }

  const onRemove = (qNum) => {
    const remaining = allQuestions.filter(
      (q) => !(q.part_number === selectedPart && q.question_number === qNum)
    )
    const startQ = PART_CONFIG[selectedPart].startQ
    remaining
      .filter((q) => q.part_number === selectedPart)
      .sort((a, b) => a.question_number - b.question_number)
      .forEach((q, i) => {
        q.question_number = startQ + i
      })
    setAllQuestions(remaining)
  }

  const onAdd = () => {
    const { questions: max, startQ } = PART_CONFIG[selectedPart]
    if (currentPartQs.length >= max) {
      toast.error(`Max ${max} questions for Part ${selectedPart}`)
      return
    }
    setAllQuestions((prev) => [
      ...prev,
      {
        question_number: startQ + currentPartQs.length,
        question_text: '',
        options: defaultOptions(selectedPart),
        correct_answer: '',
        part_number: selectedPart,
        has_image_options: false,
      },
    ])
  }

  const validate = () => {
    const e = {}
    if (!editableSetNumber?.toString().trim())
      e.setNumber = 'Set number is required'
    if (!year?.toString().trim()) e.year = 'Year is required'
    ;[1, 2, 3, 4].forEach((p) => {
      if (!audioMap[p]?.trim())
        e[`audio_${p}`] = `Audio for Part ${p} is required`
    })
    part5Dialogues.forEach((d, i) => {
      if (!d.audio?.trim())
        e[`audio_5_${i}`] = `Audio for Part 5 Dialogue ${i + 1} is required`
    })
    Object.entries(part3SharedOptions).forEach(([k, v]) => {
      if (!v?.trim()) e[`p3opt_${k}`] = `Part 3 option ${k} is required`
    })
    allQuestions.forEach((q) => {
      if (!q.question_text?.trim())
        e[`q${q.question_number}_text`] = `Q${q.question_number} text required`
      if (q.part_number !== 3 && !q.has_image_options) {
        Object.entries(q.options || {}).forEach(([k, v]) => {
          if (!v?.trim())
            e[`q${q.question_number}_opt_${k}`] = `Option ${k} required`
        })
      }
      if (!q.correct_answer?.trim())
        e[`q${q.question_number}_correct`] =
          `Select answer for Q${q.question_number}`
    })
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveSet = async () => {
    if (isSaving.current) return
    if (!validate()) {
      toast.error('Please fix all errors before saving')
      return
    }
    if (setExistsError) return
    isSaving.current = true
    setSaving(true)
    try {
      let targetSet = editableSetNumber
      if (!targetSet) {
        const res = await api.get('/listening/sets')
        targetSet = (
          Math.max(...(res.data.sets?.map((s) => s.set_number) || [0]), 0) + 1
        ).toString()
      }

      for (const q of allQuestions) {
        const part = q.part_number
        let audio_url = ''
        let passage_title = instructionMap[part] || ''
        let passage = null

        if (part === 5) {
          const dialogueIdx = Math.floor(
            (q.question_number - PART_CONFIG[5].startQ) / 2
          )
          const dialogue = part5Dialogues[Math.min(dialogueIdx, 2)]
          audio_url = dialogue?.audio || ''
          passage_title = dialogue?.instruction || ''
        } else {
          audio_url = audioMap[part] || ''
        }

        if (part === 3) {
          passage = JSON.stringify({
            answer_label: 'Match each speaker to the correct option.',
          })
        }

        const payload = {
          component: 'listening',
          set_number: parseInt(targetSet),
          part_number: part,
          question_number: q.question_number,
          question_text: q.question_text || '',
          options: part === 3 ? part3SharedOptions : q.options || {},
          correct_answer: q.correct_answer,
          audio_url,
          passage_title,
          passage,
          year: parseInt(year),
        }

        if (q.id) await api.put(`/admin/questions/${q.id}`, payload)
        else await api.post('/admin/questions', payload)
      }

      localStorage.removeItem(`listening_admin_draft_${sessionDraftId.current}`)
      setUnsavedChanges(false)
      toast.success(`Set ${targetSet} saved!`)
      navigate('/admin/listening')
    } catch {
      toast.error('Failed to save set')
    } finally {
      if (isMounted.current) setSaving(false)
      isSaving.current = false
    }
  }

  const errKey = (k) =>
    fieldErrors[k] ? 'border-[#E9424C]' : 'border-[#151313]'
  const labelErr = (k) => (fieldErrors[k] ? 'text-[#E9424C]' : 'text-[#151313]')
  const ErrMsg = ({ k }) =>
    fieldErrors[k] ? (
      <p className="text-[10px] text-[#E9424C] font-medium">{fieldErrors[k]}</p>
    ) : null

  const renderPartSetup = () => {
    if (selectedPart === 5)
      return (
        <div className="space-y-4">
          {part5Dialogues.map((dialogue, i) => (
            <div
              key={i}
              className="space-y-3 p-4 border-2 border-[#151313]/10 rounded-xl bg-[#f7f7f5]"
            >
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
                  Instruction
                </Label>
                <Input
                  value={dialogue.instruction}
                  onChange={(e) =>
                    setPart5Dialogues((prev) =>
                      prev.map((d, idx) =>
                        idx === i ? { ...d, instruction: e.target.value } : d
                      )
                    )
                  }
                  className="border-2 border-[#151313] rounded-xl text-sm"
                  placeholder="e.g. Listen to a conversation between two students..."
                />
              </div>
              <AudioUploader
                label={`Dialogue ${i + 1} Audio (Q${25 + i * 2}–Q${26 + i * 2})`}
                value={dialogue.audio}
                onChange={(url) =>
                  setPart5Dialogues((prev) =>
                    prev.map((d, idx) => (idx === i ? { ...d, audio: url } : d))
                  )
                }
                uploadPath={`listening_s${editableSetNumber || 'new'}_${year || 'unknown'}_p5${'abc'[i]}`}
              />
              {fieldErrors[`audio_5_${i}`] && (
                <p className="text-[10px] text-[#E9424C] font-medium">
                  {fieldErrors[`audio_5_${i}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      )

    if (selectedPart === 3)
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
              Part Instruction
            </Label>
            <Input
              value={instructionMap[3] || ''}
              onChange={(e) =>
                setInstructionMap((p) => ({ ...p, 3: e.target.value }))
              }
              className="border-2 border-[#151313] rounded-xl text-sm"
              placeholder="e.g. Listen and match each speaker to the correct room."
            />
          </div>
          <AudioUploader
            label="Part 3 Audio"
            value={audioMap[3] || ''}
            onChange={(url) => setAudioMap((p) => ({ ...p, 3: url }))}
            uploadPath={`listening_s${editableSetNumber || 'new'}_${year || 'unknown'}_p3`}
          />
          {fieldErrors.audio_3 && (
            <p className="text-[10px] text-[#E9424C] font-medium">
              {fieldErrors.audio_3}
            </p>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
              Shared Options (A–E)
            </Label>
            <p className="text-[10px] text-[#151313]/50 font-medium">
              These 5 options appear for all 3 questions. Students match each
              speaker to one option.
            </p>
            {Object.entries(part3SharedOptions).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#151313] w-4 shrink-0">
                    {key}
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      setPart3SharedOptions((p) => ({
                        ...p,
                        [key]: e.target.value,
                      }))
                      setFieldErrors((p) => {
                        const n = { ...p }
                        delete n[`p3opt_${key}`]
                        return n
                      })
                    }}
                    className={`flex-1 border-2 rounded-xl text-sm ${fieldErrors[`p3opt_${key}`] ? 'border-[#E9424C]' : 'border-[#151313]'}`}
                    placeholder={`Option ${key}`}
                  />
                </div>
                <ErrMsg k={`p3opt_${key}`} />
              </div>
            ))}
          </div>
        </div>
      )

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
            Part Instruction
          </Label>
          <Input
            value={instructionMap[selectedPart] || ''}
            onChange={(e) =>
              setInstructionMap((p) => ({
                ...p,
                [selectedPart]: e.target.value,
              }))
            }
            className="border-2 border-[#151313] rounded-xl text-sm"
            placeholder="e.g. Listen to a conversation between..."
          />
        </div>
        <AudioUploader
          label={`Part ${selectedPart} Audio`}
          value={audioMap[selectedPart] || ''}
          onChange={(url) =>
            setAudioMap((p) => ({ ...p, [selectedPart]: url }))
          }
          uploadPath={`listening_s${editableSetNumber || 'new'}_${year || 'unknown'}_p${selectedPart}`}
        />
        {fieldErrors[`audio_${selectedPart}`] && (
          <p className="text-[10px] text-[#E9424C] font-medium">
            {fieldErrors[`audio_${selectedPart}`]}
          </p>
        )}
      </div>
    )
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#151313] bg-gray-200 animate-pulse" />
        </div>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
          {[1, 2, 3].map((i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f7f7f5]">
        <ExitWarningDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onConfirm={() => {
            setUnsavedChanges(false)
            navigate('/admin/listening')
          }}
          onCancel={() => setShowExitDialog(false)}
          title="Unsaved Changes"
          description="You have unsaved changes. If you leave now, your progress will be lost."
          cancelText="Stay"
          confirmText="Leave"
        />

        <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              unsavedChanges
                ? setShowExitDialog(true)
                : navigate('/admin/listening')
            }
            className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Button>
          <p className="text-[10px] font-semibold text-[#151313]/40 flex-1 min-w-[200px]">
            Editing Set {editableSetNumber || 'New'} • Part {selectedPart}
          </p>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 bg-white border-2 border-[#151313] rounded-xl px-3 py-1.5">
                  <span className="text-xs font-black text-[#151313]/60">
                    Duration:
                  </span>
                  <span className="text-xs font-black text-[#151313]">
                    50 min
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Listening test duration is fixed at 50 minutes</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <Label
                className={`text-xs font-black whitespace-nowrap ${labelErr('setNumber')}`}
              >
                Set
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                value={editableSetNumber}
                onChange={(e) => {
                  setEditableSetNumber(e.target.value.replace(/[^0-9]/g, ''))
                  setFieldErrors((p) => {
                    const n = { ...p }
                    delete n.setNumber
                    return n
                  })
                  setSetExistsError('')
                }}
                className={`w-24 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[11px] ${setExistsError || fieldErrors.setNumber ? 'border-[#E9424C]' : 'border-[#151313]'}`}
                placeholder="Enter Set"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                className={`text-xs font-black whitespace-nowrap ${labelErr('year')}`}
              >
                Year
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                value={year}
                onChange={(e) => {
                  setYear(
                    e.target.value
                      ? parseInt(e.target.value.replace(/[^0-9]/g, ''))
                      : ''
                  )
                  setFieldErrors((p) => {
                    const n = { ...p }
                    delete n.year
                    return n
                  })
                  setSetExistsError('')
                }}
                className={`w-20 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[9px] ${setExistsError || fieldErrors.year ? 'border-[#E9424C]' : 'border-[#151313]'}`}
                placeholder="Enter Year"
              />
            </div>
            {setExistsError && (
              <p className="text-[10px] text-[#E9424C] font-medium whitespace-nowrap">
                {setExistsError}
              </p>
            )}
            <Button
              onClick={saveSet}
              disabled={saving}
              className="bg-[#E9424C] text-white font-black text-xs border-2 border-[#151313] rounded-xl px-4 py-2 shadow-[2px_2px_0px_#151313] shrink-0 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
          <Tabs
            value={selectedPart.toString()}
            onValueChange={(v) => {
              setSelectedPart(parseInt(v))
              setDefaultGenerated(false)
            }}
          >
            <TabsList className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 w-full mb-6 flex flex-wrap">
              {[1, 2, 3, 4, 5].map((p) => (
                <TabsTrigger
                  key={p}
                  value={p.toString()}
                  className="text-[10px] font-black rounded-lg px-3 py-1.5 data-[state=active]:bg-[#151313] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_#E9424C] transition-all flex-1"
                >
                  Part {p}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedPart.toString()} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Part {selectedPart}
                </span>
                <span className="text-[10px] text-[#151313]/40 font-medium">
                  {PART_CONFIG[selectedPart].label}
                </span>
              </div>

              <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
                <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
                  <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                    Audio & Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">{renderPartSetup()}</CardContent>
              </Card>

              <div className="space-y-4">
                <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                  QUESTIONS ({currentPartQs.length}/
                  {PART_CONFIG[selectedPart].questions})
                </span>
                <div className="space-y-4">
                  {currentPartQs.map((q, idx) => (
                    <Card
                      key={`${q.part_number}-${q.question_number}`}
                      className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden"
                    >
                      <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onMove(idx, -1)}
                                disabled={idx === 0}
                                className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
                              >
                                <ArrowUp size={10} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onMove(idx, 1)}
                                disabled={idx === currentPartQs.length - 1}
                                className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
                              >
                                <ArrowDown size={10} />
                              </Button>
                            </div>
                            <CardTitle className="text-sm font-black text-[#151313]">
                              <span className="text-[#E9424C] mr-2">
                                {q.question_number}.
                              </span>
                              Question
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(q.question_number)}
                            className="text-[#E9424C] hover:text-[#E9424C]"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-1">
                          <Label
                            className={`text-xs font-black uppercase tracking-widest ${labelErr(`q${q.question_number}_text`)}`}
                          >
                            Question Text
                          </Label>
                          <Input
                            value={q.question_text}
                            onChange={(e) =>
                              onText(q.question_number, e.target.value)
                            }
                            className={`border-2 rounded-xl text-sm ${errKey(`q${q.question_number}_text`)}`}
                            placeholder="Enter question text..."
                          />
                          <ErrMsg k={`q${q.question_number}_text`} />
                        </div>

                        {selectedPart === 3 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-black text-[#151313] uppercase tracking-widest">
                              Correct Answer
                            </Label>
                            <div className="flex gap-2">
                              {['A', 'B', 'C', 'D', 'E'].map((key) => {
                                const isCorrect = q.correct_answer === key
                                return (
                                  <Button
                                    key={key}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      onCorrect(q.question_number, key)
                                    }
                                    className={`w-9 h-9 p-0 rounded-full border-2 text-xs font-black ${isCorrect ? 'bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#22c55e] hover:text-white' : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'}`}
                                  >
                                    {isCorrect ? <Check size={12} /> : key}
                                  </Button>
                                )
                              })}
                            </div>
                            <ErrMsg k={`q${q.question_number}_correct`} />
                          </div>
                        )}

                        {selectedPart !== 3 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                id={`img-opt-${q.question_number}`}
                                checked={q.has_image_options}
                                onCheckedChange={(checked) =>
                                  setAllQuestions((prev) =>
                                    prev.map((x) => {
                                      if (
                                        !(
                                          x.part_number === selectedPart &&
                                          x.question_number ===
                                            q.question_number
                                        )
                                      )
                                        return x
                                      if (checked) {
                                        return {
                                          ...x,
                                          has_image_options: true,
                                          prev_text_options: x.options,
                                          options:
                                            x.prev_image_options ||
                                            defaultImageOptions(),
                                        }
                                      } else {
                                        return {
                                          ...x,
                                          has_image_options: false,
                                          prev_image_options: x.options,
                                          options:
                                            x.prev_text_options ||
                                            defaultOptions(selectedPart),
                                        }
                                      }
                                    })
                                  )
                                }
                              />
                              <Label
                                htmlFor={`img-opt-${q.question_number}`}
                                className="text-xs font-black text-[#151313] cursor-pointer"
                              >
                                Image options
                              </Label>
                            </div>

                            <Label className="text-xs font-black text-[#151313] uppercase tracking-widest">
                              Options
                            </Label>

                            {q.has_image_options ? (
                              <div className="grid grid-cols-3 gap-3">
                                {['A', 'B', 'C'].map((key) => {
                                  const isCorrect = q.correct_answer === key
                                  return (
                                    <div key={key} className="space-y-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          onCorrect(q.question_number, key)
                                        }
                                        className={`w-8 h-8 p-0 rounded-full border-2 text-xs font-black mb-1 ${isCorrect ? 'bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#22c55e] hover:text-white' : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'}`}
                                      >
                                        {isCorrect ? <Check size={12} /> : key}
                                      </Button>
                                      <ImageOptionUploader
                                        optKey={key}
                                        value={q.options[key] || ''}
                                        onChange={(url) =>
                                          onOption(q.question_number, key, url)
                                        }
                                        setNum={editableSetNumber || 'new'}
                                        year={year || 'unknown'}
                                        qNum={q.question_number}
                                      />
                                      <ErrMsg
                                        k={`q${q.question_number}_opt_${key}`}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              /* Text options */
                              Object.entries(q.options || {}).map(
                                ([key, value]) => {
                                  const isCorrect = q.correct_answer === key
                                  const hk = `q${q.question_number}_opt_${key}`
                                  return (
                                    <div key={key} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            onCorrect(q.question_number, key)
                                          }
                                          className={`w-8 h-8 p-0 rounded-full border-2 shrink-0 ${isCorrect ? 'bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#22c55e] hover:text-white' : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'}`}
                                        >
                                          {isCorrect ? (
                                            <Check size={14} />
                                          ) : (
                                            key
                                          )}
                                        </Button>
                                        <Input
                                          value={value}
                                          onChange={(e) =>
                                            onOption(
                                              q.question_number,
                                              key,
                                              e.target.value
                                            )
                                          }
                                          className={`flex-1 border-2 rounded-xl text-sm ${fieldErrors[hk] ? 'border-[#E9424C]' : isCorrect ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#151313]'}`}
                                          placeholder={`Option ${key}`}
                                        />
                                      </div>
                                      <ErrMsg k={hk} />
                                    </div>
                                  )
                                }
                              )
                            )}
                            <ErrMsg k={`q${q.question_number}_correct`} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    disabled={
                      currentPartQs.length >=
                      PART_CONFIG[selectedPart].questions
                    }
                    className={`border-2 rounded-xl text-xs font-black px-6 ${currentPartQs.length >= PART_CONFIG[selectedPart].questions ? 'border-[#151313]/30 text-[#151313]/30 cursor-not-allowed' : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'}`}
                  >
                    <Plus size={14} className="mr-2" /> Add Question
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
