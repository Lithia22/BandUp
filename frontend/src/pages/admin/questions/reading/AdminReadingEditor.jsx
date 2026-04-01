import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import api from '../../../../services/api'
import { toast } from 'sonner'
import { QuestionCardSkeleton } from '../../../../components/layouts/Skeletons'
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'
import { QuestionCard } from './QuestionCard'

const PART_CONFIG = {
  1: { questions: 4, startQ: 1 },
  2: { questions: 5, startQ: 5 },
  3: { questions: 5, startQ: 10 },
  4: { questions: 6, startQ: 15 },
  5: { questions: 6, startQ: 21 },
  6: { questions: 7, startQ: 27 },
  7: { questions: 7, startQ: 34 },
}

const PART5_OPTIONS = { A: '', B: '', C: '', D: '', E: '', F: '', G: '' }

const extractColumnText = (col) => {
  if (!col) return ''
  try {
    const p = typeof col === 'string' ? JSON.parse(col) : col
    return [p.title, p.body, p.details, p.footer].filter(Boolean).join('\n')
  } catch {
    return typeof col === 'string' ? col : ''
  }
}

const buildColumnFromText = (text, label) => ({
  label,
  title: '',
  body: text.trim(),
  details: '',
  footer: '',
})

const parseTextToParagraphs = (text) =>
  text
    .split('\n\n')
    .filter(Boolean)
    .map((para, i) => ({
      number: i + 1,
      text: para.replace(/^\d+\.\s*/, ''),
    }))

const extractPart4Texts = (questions) => {
  let text1 = '',
    text2 = ''
  for (const q of questions.filter((q) => q.part_number === 4)) {
    if (!q.passage) continue
    try {
      const p = JSON.parse(q.passage)
      if (p.type === 'two_texts') {
        if (!text1 && p.texts?.[0]?.paragraphs)
          text1 = p.texts[0].paragraphs
            .map((x) => `${x.number}. ${x.text}`)
            .join('\n\n')
        if (!text2 && p.texts?.[1]?.paragraphs)
          text2 = p.texts[1].paragraphs
            .map((x) => `${x.number}. ${x.text}`)
            .join('\n\n')
      } else if (p.type === 'numbered_paragraphs') {
        const content =
          p.paragraphs?.map((x) => `${x.number}. ${x.text}`).join('\n\n') || ''
        if (p.label === 'Text 1' && !text1) text1 = content
        if (p.label === 'Text 2' && !text2) text2 = content
      }
      if (text1 && text2) break
    } catch {}
  }
  return { text1, text2 }
}

export default function AdminReadingEditor() {
  const navigate = useNavigate()
  const { setNumber } = useParams()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')
  const isMounted = useRef(true)
  const isSaving = useRef(false)
  const suppressUnsaved = useRef(false)
  const draftLoaded = useRef(false)
  const sessionDraftId = useRef(draftId || 'autosave_new_set')
  const [selectedPart, setSelectedPart] = useState(1)
  const [allQuestions, setAllQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [editableSetNumber, setEditableSetNumber] = useState(setNumber || '')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [setExistsError, setSetExistsError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [columnA, setColumnA] = useState('')
  const [columnB, setColumnB] = useState('')
  const [columnC, setColumnC] = useState('')
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [passageMap, setPassageMap] = useState({})
  const [instructionMap, setInstructionMap] = useState({})
  const [instruction4Text1, setInstruction4Text1] = useState('')
  const [instruction4Text2, setInstruction4Text2] = useState('')
  const [instruction4Both, setInstruction4Both] = useState('')
  const [part5Options, setPart5Options] = useState({
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
    F: '',
    G: '',
  })

  const passageText = passageMap[selectedPart] || ''
  const setPassageText = (val) =>
    setPassageMap((prev) => ({ ...prev, [selectedPart]: val }))
  const instruction = instructionMap[selectedPart] || ''
  const setInstruction = (val) =>
    setInstructionMap((prev) => ({ ...prev, [selectedPart]: val }))

  const currentPartQuestions = allQuestions
    .filter((q) => q.part_number === selectedPart)
    .sort((a, b) => a.question_number - b.question_number)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const moveQuestion = (idx, direction) => {
    const partQs = [...currentPartQuestions]
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= partQs.length) return
    const temp = partQs[idx]
    partQs[idx] = partQs[newIdx]
    partQs[newIdx] = temp
    const startQ = PART_CONFIG[selectedPart].startQ
    partQs.forEach((q, i) => {
      q.question_number = startQ + i
    })
    setAllQuestions((prev) => [
      ...prev.filter((q) => q.part_number !== selectedPart),
      ...partQs,
    ])
  }

  useEffect(() => {
    if (loading || setNumber || draftId || draftLoaded.current) return
    if (currentPartQuestions.length === 0) {
      const config = PART_CONFIG[selectedPart]

      if (selectedPart === 5) {
        setAllQuestions((prev) => [
          ...prev,
          ...Array.from({ length: config.questions }, (_, i) => ({
            question_number: config.startQ + i,
            question_text: '',
            options: {},
            correct_answer: '',
            part_number: selectedPart,
            passage: null,
          })),
        ])
      } else {
        const defaultOptions =
          selectedPart >= 6
            ? { A: '', B: '', C: '', D: '' }
            : { A: '', B: '', C: '' }
        setAllQuestions((prev) => [
          ...prev,
          ...Array.from({ length: config.questions }, (_, i) => ({
            question_number: config.startQ + i,
            question_text: '',
            options: defaultOptions,
            correct_answer: '',
            part_number: selectedPart,
            passage: null,
          })),
        ])
      }
    }
  }, [selectedPart, loading])

  useEffect(() => {
    if (suppressUnsaved.current) return
    setUnsavedChanges(true)
  }, [
    allQuestions,
    passageMap,
    instructionMap,
    year,
    editableSetNumber,
    columnA,
    columnB,
    columnC,
    text1,
    text2,
    instruction4Text1,
    instruction4Text2,
    instruction4Both,
    part5Options,
  ])

  const autoSaveDraft = useCallback(() => {
    if (setNumber || allQuestions.length === 0 || !isMounted.current) return
    try {
      localStorage.setItem(
        `reading_draft_${sessionDraftId.current}`,
        JSON.stringify({
          allQuestions,
          passageMap,
          instructionMap,
          columnA,
          columnB,
          columnC,
          text1,
          text2,
          instruction4Text1,
          instruction4Text2,
          instruction4Both,
          part5Options,
          selectedPart,
          year,
          setNumber: editableSetNumber,
          timestamp: Date.now(),
        })
      )
    } catch {}
  }, [
    allQuestions,
    passageMap,
    instructionMap,
    columnA,
    columnB,
    columnC,
    text1,
    text2,
    instruction4Text1,
    instruction4Text2,
    instruction4Both,
    part5Options,
    selectedPart,
    year,
    editableSetNumber,
    setNumber,
  ])

  useEffect(() => {
    if (suppressUnsaved.current || setNumber) return
    const timer = setTimeout(autoSaveDraft, 1500)
    return () => clearTimeout(timer)
  }, [autoSaveDraft])

  useEffect(() => {
    if (setNumber) return
    const interval = setInterval(autoSaveDraft, 5000)
    return () => clearInterval(interval)
  }, [autoSaveDraft])

  const loadPassageStateForPart = (partNumber, questions) => {
    if (partNumber === 4) {
      const { text1: t1, text2: t2 } = extractPart4Texts(questions)
      setText1(t1)
      setText2(t2)
      const p4 = questions.filter((q) => q.part_number === 4)
      const q1516 = p4.find((q) => q.question_number <= 16)
      if (q1516?.passage_title) setInstruction4Text1(q1516.passage_title)

      const q1718 = p4.find(
        (q) => q.question_number >= 17 && q.question_number <= 18
      )
      if (q1718?.passage_title) setInstruction4Text2(q1718.passage_title)

      const q1920 = p4.find((q) => q.question_number >= 19)
      if (q1920?.passage_title) {
        setInstruction4Both(q1920.passage_title)
      }

      return
    }

    if (partNumber === 5) {
      const q = questions.find((q) => q.part_number === 5)
      if (q?.passage_title)
        setInstructionMap((prev) => ({
          ...prev,
          [partNumber]: q.passage_title,
        }))

      if (q?.passage) {
        try {
          const parsed = JSON.parse(q.passage)
          if (parsed.type === 'gapped_text') {
            setPassageMap((prev) => ({
              ...prev,
              [partNumber]: parsed.main_text || '',
            }))
            if (parsed.sentences) {
              const options = {}
              parsed.sentences.forEach((s) => {
                options[s.key] = s.text
              })
              setPart5Options({ ...PART5_OPTIONS, ...options })
            }
          }
        } catch {}
      }
      return
    }

    if (partNumber === 6 || partNumber === 7) {
      const q = questions.find((q) => q.part_number === partNumber)
      if (q?.passage_title)
        setInstructionMap((prev) => ({
          ...prev,
          [partNumber]: q.passage_title,
        }))

      if (q?.passage) {
        try {
          const parsed = JSON.parse(q.passage)
          if (parsed.type === 'lined_text') {
            const formatted = parsed.paragraphs
              .map((p) => `[Lines ${p.lines}] ${p.text}`)
              .join('\n\n')

            const finalText = parsed.citation
              ? formatted + '\n\n' + parsed.citation
              : formatted

            setPassageMap((prev) => ({ ...prev, [partNumber]: finalText }))
          }
        } catch {}
      }
      return
    }
    const q = questions.find((q) => q.part_number === partNumber)
    if (q?.passage_title)
      setInstructionMap((prev) => ({ ...prev, [partNumber]: q.passage_title }))
    if (!q?.passage) return
    try {
      const parsed = JSON.parse(q.passage)
      if (parsed.type === 'three_column_table') {
        setColumnA(extractColumnText(parsed.columns[0]))
        setColumnB(extractColumnText(parsed.columns[1]))
        setColumnC(extractColumnText(parsed.columns[2]))
      }
    } catch {
      setPassageMap((prev) => ({ ...prev, [partNumber]: q.passage }))
    }
  }

  const loadAllPassageStates = (questions) => {
    const newPassageMap = {},
      newInstructionMap = {}
    let newColumnA = '',
      newColumnB = '',
      newColumnC = ''
    let newText1 = '',
      newText2 = ''
    let newI4T1 = '',
      newI4T2 = '',
      newI4B = ''
    let newPart5Options = { A: '', B: '', C: '', D: '', E: '', F: '', G: '' }

    for (const part of [1, 2, 3, 4, 5, 6, 7]) {
      if (part === 4) {
        const { text1: t1, text2: t2 } = extractPart4Texts(questions)
        newText1 = t1
        newText2 = t2
        const p4 = questions.filter((q) => q.part_number === 4)

        const q1516 = p4.find((q) => q.question_number <= 16)
        const q1718 = p4.find(
          (q) => q.question_number >= 17 && q.question_number <= 18
        )
        const q1920 = p4.find((q) => q.question_number >= 19)

        if (q1516?.passage_title) newI4T1 = q1516.passage_title
        if (q1718?.passage_title) newI4T2 = q1718.passage_title
        if (q1920?.passage_title) newI4B = q1920.passage_title
        continue
      }

      if (part === 5) {
        const p5q = questions.find((q) => q.part_number === 5)
        if (p5q?.options) newPart5Options = { ...PART5_OPTIONS, ...p5q.options }
        if (p5q?.passage_title) newInstructionMap[5] = p5q.passage_title

        if (p5q?.passage) {
          try {
            const parsed = JSON.parse(p5q.passage)
            if (parsed.type === 'gapped_text') {
              newPassageMap[5] = parsed.main_text || ''
              if (parsed.sentences) {
                const options = {}
                parsed.sentences.forEach((s) => {
                  options[s.key] = s.text
                })
                newPart5Options = { ...PART5_OPTIONS, ...options }
              }
            }
          } catch {}
        }
        continue
      }

      if (part === 6 || part === 7) {
        const q = questions.find((q) => q.part_number === part)
        if (!q) continue

        if (q.passage_title) newInstructionMap[part] = q.passage_title

        if (q.passage) {
          try {
            const parsed = JSON.parse(q.passage)
            if (parsed.type === 'lined_text') {
              const formatted = parsed.paragraphs
                .map((p) => `[Lines ${p.lines}] ${p.text}`)
                .join('\n\n')

              newPassageMap[part] = parsed.citation
                ? formatted + '\n\n' + parsed.citation
                : formatted
            }
          } catch {}
        }
        continue
      }

      const q = questions.find((q) => q.part_number === part)
      if (!q) continue
      if (q.passage_title) newInstructionMap[part] = q.passage_title
      if (!q.passage) continue
      try {
        const parsed = JSON.parse(q.passage)
        if (parsed.type === 'three_column_table') {
          newColumnA = extractColumnText(parsed.columns[0])
          newColumnB = extractColumnText(parsed.columns[1])
          newColumnC = extractColumnText(parsed.columns[2])
        } else if (parsed.type === 'gapped_text') {
          newPassageMap[part] = parsed.main_text || ''
        } else if (parsed.type === 'lined_text') {
          newPassageMap[part] =
            parsed.paragraphs
              ?.map((p) => `[Lines ${p.lines}] ${p.text}`)
              .join('\n\n') || ''
        } else {
          newPassageMap[part] = q.passage
        }
      } catch {
        newPassageMap[part] = q.passage
      }
    }

    setPassageMap(newPassageMap)
    setInstructionMap(newInstructionMap)
    setColumnA(newColumnA)
    setColumnB(newColumnB)
    setColumnC(newColumnC)
    setText1(newText1)
    setText2(newText2)
    setInstruction4Text1(newI4T1)
    setInstruction4Text2(newI4T2)
    setInstruction4Both(newI4B)
    setPart5Options(newPart5Options)
  }

  const loadSet = async (setNum) => {
    if (!isMounted.current) return

    setLoading(true)
    suppressUnsaved.current = true
    try {
      const res = await api.get(`/reading/sets/${setNum}`)
      if (!isMounted.current) return

      const questions = res.data.questions
      if (questions.length > 0) {
        setYear(questions[0].year || new Date().getFullYear())
        setEditableSetNumber(setNum)
        const mapped = questions.map((q) => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text || '',
          options: q.options || {},
          correct_answer: q.correct_answer
            ? String(q.correct_answer).trim()
            : '',
          part_number: q.part_number,
          passage: q.passage,
          passage_title: q.passage_title,
        }))
        setAllQuestions(mapped)
        loadAllPassageStates(mapped)
      }
    } catch {
      if (isMounted.current) toast.error('Failed to load set')
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setUnsavedChanges(false)
      }
      setTimeout(() => {
        if (isMounted.current) suppressUnsaved.current = false
      }, 100)
    }
  }

  const loadDraft = (id) => {
    try {
      const draft = JSON.parse(localStorage.getItem(`reading_draft_${id}`))
      if (!draft || !isMounted.current) return

      draftLoaded.current = true
      setAllQuestions(draft.allQuestions || [])
      setPassageMap(draft.passageMap || {})
      setInstructionMap(draft.instructionMap || {})
      setColumnA(draft.columnA || '')
      setColumnB(draft.columnB || '')
      setColumnC(draft.columnC || '')
      setText1(draft.text1 || '')
      setText2(draft.text2 || '')
      setInstruction4Text1(draft.instruction4Text1 || '')
      setInstruction4Text2(draft.instruction4Text2 || '')
      setInstruction4Both(draft.instruction4Both || '')
      setPart5Options(
        draft.part5Options || {
          A: '',
          B: '',
          C: '',
          D: '',
          E: '',
          F: '',
          G: '',
        }
      )
      setSelectedPart(draft.selectedPart || 1)
      setYear(draft.year || new Date().getFullYear())
      setEditableSetNumber(draft.setNumber || '')
      setUnsavedChanges(false)
    } catch {}
  }

  useEffect(() => {
    if (setNumber) {
      loadSet(setNumber)
      setEditableSetNumber(setNumber)
    } else if (draftId) {
      loadDraft(draftId)
    } else {
      const existing = localStorage.getItem(
        `reading_draft_${sessionDraftId.current}`
      )
      if (existing) loadDraft(sessionDraftId.current)
    }
  }, [setNumber, draftId])

  const updateOption = (questionNumber, field, value) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.part_number === selectedPart && q.question_number === questionNumber
          ? { ...q, [field]: value }
          : q
      )
    )
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`q${questionNumber}_${field}`]
      return next
    })
  }

  const updateCorrectAnswer = (questionNumber, value) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.part_number === selectedPart && q.question_number === questionNumber
          ? { ...q, correct_answer: value }
          : q
      )
    )
  }

  const addQuestion = () => {
    const config = PART_CONFIG[selectedPart]
    if (currentPartQuestions.length >= config.questions) {
      toast.error(
        `Cannot add more than ${config.questions} questions for Part ${selectedPart}`
      )
      return
    }

    if (selectedPart === 5) {
      setAllQuestions((prev) => [
        ...prev,
        {
          question_number: config.startQ + currentPartQuestions.length,
          question_text: '',
          options: {},
          correct_answer: '',
          part_number: selectedPart,
          passage: null,
        },
      ])
    } else {
      const defaultOptions =
        selectedPart >= 6
          ? { A: '', B: '', C: '', D: '' }
          : { A: '', B: '', C: '' }
      setAllQuestions((prev) => [
        ...prev,
        {
          question_number: config.startQ + currentPartQuestions.length,
          question_text: '',
          options: defaultOptions,
          correct_answer: '',
          part_number: selectedPart,
          passage: null,
        },
      ])
    }
  }

  const removeQuestion = (questionNumber) => {
    const remaining = allQuestions.filter(
      (q) =>
        !(
          q.part_number === selectedPart && q.question_number === questionNumber
        )
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

  const validateBeforeSave = () => {
    const errors = {}
    if (!editableSetNumber?.toString().trim())
      errors.setNumber = 'Set number is required'
    if (!year?.toString().trim()) errors.year = 'Year is required'
    ;[1, 2, 3, 5, 6, 7].forEach((part) => {
      if (!instructionMap[part]?.trim())
        errors[`instruction_${part}`] =
          `Instruction for Part ${part} is required`
    })
    if (!instruction4Text1?.trim())
      errors.instruction4Text1 = 'Part 4 Text 1 instruction is required'
    if (!instruction4Text2?.trim())
      errors.instruction4Text2 = 'Part 4 Text 2 instruction is required'
    if (!instruction4Both?.trim())
      errors.instruction4Both = 'Part 4 both texts instruction is required'
    if (!columnA?.trim()) errors.columnA = 'Notice A is required'
    if (!columnB?.trim()) errors.columnB = 'Notice B is required'
    if (!columnC?.trim()) errors.columnC = 'Notice C is required'
    if (!text1?.trim()) errors.text1 = 'Text 1 is required'
    if (!text2?.trim()) errors.text2 = 'Text 2 is required'
    ;[2, 3, 5, 6, 7].forEach((part) => {
      if (!passageMap[part]?.trim())
        errors[`passage_${part}`] = `Passage text for Part ${part} is required`
    })

    Object.entries(part5Options).forEach(([key, val]) => {
      if (!val?.trim()) errors[`part5_opt_${key}`] = `Option ${key} is required`
    })

    allQuestions.forEach((q) => {
      if (q.part_number !== 5) {
        if (!q.question_text?.trim())
          errors[`q${q.question_number}_text`] =
            `Question ${q.question_number} text is required`

        Object.entries(q.options).forEach(([key, val]) => {
          if (!val?.trim())
            errors[`q${q.question_number}_opt_${key}`] =
              `Option ${key} for Q${q.question_number} is required`
        })
      }

      if (!q.correct_answer?.trim())
        errors[`q${q.question_number}_correct`] =
          `Select correct answer for Q${q.question_number}`
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    const check = async () => {
      if (!editableSetNumber || !year) {
        setSetExistsError('')
        return
      }
      if (setNumber && editableSetNumber === setNumber) {
        setSetExistsError('')
        return
      }
      try {
        const res = await api.get('/reading/sets')
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

  const saveSet = async () => {
    if (isSaving.current) return
    if (!validateBeforeSave()) {
      toast.error('Please fix all errors before saving')
      return
    }
    if (setExistsError) return

    isSaving.current = true
    setSaving(true)
    try {
      let targetSetNumber = editableSetNumber
      if (!targetSetNumber) {
        const res = await api.get('/reading/sets')
        targetSetNumber = (
          Math.max(...(res.data.sets?.map((s) => s.set_number) || [0]), 0) + 1
        ).toString()
      }

      for (const q of allQuestions) {
        const part = q.part_number
        let passage, passage_title

        if (part === 4) {
          const t1Json = JSON.stringify({
            type: 'numbered_paragraphs',
            label: 'Text 1',
            paragraphs: parseTextToParagraphs(text1),
          })
          const t2Json = JSON.stringify({
            type: 'numbered_paragraphs',
            label: 'Text 2',
            paragraphs: parseTextToParagraphs(text2),
          })
          const bothJson = JSON.stringify({
            type: 'two_texts',
            texts: [
              { label: 'Text 1', paragraphs: parseTextToParagraphs(text1) },
              { label: 'Text 2', paragraphs: parseTextToParagraphs(text2) },
            ],
          })

          if (q.question_number <= 16) {
            passage = t1Json
            passage_title = instruction4Text1
          } else if (q.question_number <= 18) {
            passage = t2Json
            passage_title = instruction4Text2
          } else {
            passage = bothJson
            passage_title = instruction4Both
          }
        } else if (part === 1) {
          passage = JSON.stringify({
            type: 'three_column_table',
            columns: [
              buildColumnFromText(columnA, 'A'),
              buildColumnFromText(columnB, 'B'),
              buildColumnFromText(columnC, 'C'),
            ],
          })
          passage_title = instructionMap[1] || ''
        } else if (part === 5) {
          const mainText = passageMap[5] || ''

          const paragraphs = mainText
            .split('\n\n')
            .map((para, index) => {
              const number = index + 1
              const cleanText = para.replace(/^\d+\s+/, '')
              return `${number}\t${cleanText}`
            })
            .join('\n\n')

          passage = JSON.stringify({
            type: 'gapped_text',
            main_text: paragraphs,
            sentences: Object.entries(part5Options)
              .filter(([_, text]) => text.trim())
              .map(([key, text]) => ({
                key,
                text: text.trim(),
              })),
          })
          passage_title = instructionMap[5] || ''
        } else if (part === 6 || part === 7) {
          const text = passageMap[part] || ''
          const lines = text.split('\n').filter((line) => line.trim())
          const paragraphs = []
          let citation = ''

          lines.forEach((line) => {
            if (line.includes('Adapted from')) {
              citation = line.trim()
              return
            }

            const lineMatch = line.match(/\[Lines ([\d-]+)\]\s*(.*)/)
            if (lineMatch) {
              paragraphs.push({
                number: paragraphs.length + 1,
                lines: lineMatch[1],
                text: lineMatch[2].trim(),
              })
            }
          })

          const passageObj = {
            type: 'lined_text',
            paragraphs: paragraphs,
          }

          if (citation) {
            passageObj.citation = citation
          }

          passage = JSON.stringify(passageObj)
          passage_title = instructionMap[part] || ''
        } else {
          passage = passageMap[part] || ''
          passage_title = instructionMap[part] || ''
        }

        const payload = {
          component: 'reading',
          set_number: parseInt(targetSetNumber),
          part_number: part,
          question_number: q.question_number,
          question_text: q.question_text || '',
          options: q.options || {},
          correct_answer: q.correct_answer,
          passage,
          passage_title,
          year: parseInt(year),
        }

        if (q.id) {
          await api.put(`/admin/questions/${q.id}`, payload)
        } else {
          await api.post('/admin/questions', payload)
        }
      }

      if (isMounted.current) {
        localStorage.removeItem(`reading_draft_${sessionDraftId.current}`)
        toast.success(`Set ${targetSetNumber} saved successfully!`)
        navigate('/admin/reading')
      }
    } catch {
      if (isMounted.current) {
        toast.error('Failed to save set')
      }
    } finally {
      if (isMounted.current) setSaving(false)
      isSaving.current = false
    }
  }

  const errKey = (key) =>
    fieldErrors[key] ? 'border-[#E9424C]' : 'border-[#151313]'
  const labelErr = (key) =>
    fieldErrors[key] ? 'text-[#E9424C]' : 'text-[#151313]'
  const ErrMsg = ({ k }) =>
    fieldErrors[k] ? (
      <p className="text-[10px] text-[#E9424C] font-medium">{fieldErrors[k]}</p>
    ) : null

  const renderPassageEditor = () => {
    if (selectedPart === 1)
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('instruction_1')}`}
            >
              Instruction Text
            </Label>
            <Input
              value={instructionMap[1] || ''}
              onChange={(e) => {
                setInstructionMap((p) => ({ ...p, 1: e.target.value }))
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.instruction_1
                  return n
                })
              }}
              className={`border-2 rounded-xl text-sm ${errKey('instruction_1')}`}
              placeholder="e.g. Read three short texts about..."
            />
            <ErrMsg k="instruction_1" />
          </div>
          <Separator className="bg-[#151313]/10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'A', value: columnA, setter: setColumnA, ek: 'columnA' },
              { label: 'B', value: columnB, setter: setColumnB, ek: 'columnB' },
              { label: 'C', value: columnC, setter: setColumnC, ek: 'columnC' },
            ].map(({ label, value, setter, ek }) => (
              <div key={label} className="space-y-2">
                <Label
                  className={`text-xs font-black uppercase tracking-widest ${labelErr(ek)}`}
                >
                  Notice {label}
                </Label>
                <Textarea
                  value={value}
                  onChange={(e) => {
                    setter(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n[ek]
                      return n
                    })
                  }}
                  rows={12}
                  className={`font-mono text-sm border-2 rounded-xl ${errKey(ek)} focus-visible:border-[#E9424C]`}
                  placeholder={`Paste Notice ${label} here...`}
                />
                <ErrMsg k={ek} />
              </div>
            ))}
          </div>
        </div>
      )

    if (selectedPart === 4)
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('instruction4Text1')}`}
            >
              Text 1 Instruction
            </Label>
            <Input
              value={instruction4Text1}
              onChange={(e) => {
                setInstruction4Text1(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.instruction4Text1
                  return n
                })
              }}
              className={`border-2 rounded-xl text-sm ${errKey('instruction4Text1')}`}
              placeholder="e.g. Read two texts about..."
            />
            <ErrMsg k="instruction4Text1" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
              Text 1
            </Label>
            <Textarea
              value={text1}
              onChange={(e) => {
                setText1(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.text1
                  return n
                })
              }}
              rows={12}
              className={`font-mono text-sm border-2 rounded-xl ${errKey('text1')} focus-visible:border-[#E9424C]`}
              placeholder="Text 1 paragraphs..."
            />
            <ErrMsg k="text1" />
          </div>
          <Separator className="bg-[#151313]/10" />
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('instruction4Text2')}`}
            >
              Text 2 Instruction
            </Label>
            <Textarea
              value={instruction4Text2}
              onChange={(e) => {
                setInstruction4Text2(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.instruction4Text2
                  return n
                })
              }}
              rows={3}
              className={`border-2 rounded-xl text-sm ${errKey('instruction4Text2')}`}
              placeholder="e.g. Read two texts about..."
            />
            <ErrMsg k="instruction4Text2" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
              Text 2
            </Label>
            <Textarea
              value={text2}
              onChange={(e) => {
                setText2(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.text2
                  return n
                })
              }}
              rows={12}
              className={`font-mono text-sm border-2 rounded-xl ${errKey('text2')} focus-visible:border-[#E9424C]`}
              placeholder="Text 2 paragraphs..."
            />
            <ErrMsg k="text2" />
          </div>
          <Separator className="bg-[#151313]/10" />
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('instruction4Both')}`}
            >
              Both Texts Instruction (Q19–20)
            </Label>
            <Textarea
              value={instruction4Both}
              onChange={(e) => {
                setInstruction4Both(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.instruction4Both
                  return n
                })
              }}
              rows={3}
              className={`border-2 rounded-xl text-sm ${errKey('instruction4Both')}`}
              placeholder="e.g. Read two texts about..."
            />
            <ErrMsg k="instruction4Both" />
          </div>
        </div>
      )

    if (selectedPart === 5) {
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('instruction_5')}`}
            >
              Instruction Text
            </Label>
            <Input
              value={instruction}
              onChange={(e) => {
                setInstruction(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.instruction_5
                  return n
                })
              }}
              className={`border-2 rounded-xl text-sm ${errKey('instruction_5')}`}
              placeholder="e.g. Six sentences have been removed from the text..."
            />
            <ErrMsg k="instruction_5" />
          </div>
          <Separator className="bg-[#151313]/10" />
          <div className="space-y-2">
            <Label
              className={`text-xs font-black uppercase tracking-widest ${labelErr('passage_5')}`}
            >
              Main Text with Gaps
            </Label>
            <Textarea
              value={passageText}
              onChange={(e) => {
                setPassageText(e.target.value)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.passage_5
                  return n
                })
              }}
              rows={12}
              className={`font-mono text-sm border-2 rounded-xl ${errKey('passage_5')} focus-visible:border-[#E9424C]`}
              placeholder="Paste the text with numbered paragraphs and _____ gaps here..."
            />
            <ErrMsg k="passage_5" />
          </div>
          <Separator className="bg-[#151313]/10" />
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
              Sentences A to G
            </Label>
            <p className="text-[10px] text-[#151313]/50 font-medium">
              These 7 options apply to all 6 questions in Part 5. One will be
              the extra sentence students do not need to use.
            </p>
            {Object.keys(part5Options).map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#151313] w-4 shrink-0">
                    {key}
                  </span>
                  <Input
                    value={part5Options[key]}
                    onChange={(e) => {
                      setPart5Options((p) => ({
                        ...p,
                        [key]: e.target.value,
                      }))
                      setFieldErrors((p) => {
                        const n = { ...p }
                        delete n[`part5_opt_${key}`]
                        return n
                      })
                    }}
                    className={`flex-1 border-2 rounded-xl text-sm ${
                      fieldErrors[`part5_opt_${key}`]
                        ? 'border-[#E9424C]'
                        : 'border-[#151313]'
                    }`}
                    placeholder={`Sentence ${key}`}
                  />
                </div>
                <ErrMsg k={`part5_opt_${key}`} />
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Label
            className={`text-xs font-black uppercase tracking-widest ${labelErr(`instruction_${selectedPart}`)}`}
          >
            Instruction Text
          </Label>
          <Input
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value)
              setFieldErrors((p) => {
                const n = { ...p }
                delete n[`instruction_${selectedPart}`]
                return n
              })
            }}
            className={`border-2 rounded-xl text-sm ${errKey(`instruction_${selectedPart}`)}`}
            placeholder="e.g. Read a text about..."
          />
          <ErrMsg k={`instruction_${selectedPart}`} />
        </div>
        <Separator className="bg-[#151313]/10" />
        <div className="space-y-2">
          <Label
            className={`text-xs font-black uppercase tracking-widest ${labelErr(`passage_${selectedPart}`)}`}
          >
            Passage Text
          </Label>
          <Textarea
            value={passageText}
            onChange={(e) => {
              setPassageText(e.target.value)
              setFieldErrors((p) => {
                const n = { ...p }
                delete n[`passage_${selectedPart}`]
                return n
              })
            }}
            rows={12}
            className={`font-mono text-sm border-2 rounded-xl ${errKey(`passage_${selectedPart}`)} focus-visible:border-[#E9424C]`}
            placeholder="Paste the passage here..."
          />
          <ErrMsg k={`passage_${selectedPart}`} />
        </div>
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
          onConfirm={() => navigate('/admin/reading')}
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
                : navigate('/admin/reading')
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
                    75 min
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reading test duration is fixed at 75 minutes</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2">
              <Label
                className={`text-xs font-black whitespace-nowrap ${labelErr('setNumber')}`}
              >
                Set
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                  className={`w-20 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[9px] pr-7 ${
                    setExistsError || fieldErrors.setNumber
                      ? 'border-[#E9424C]'
                      : 'border-[#151313]'
                  }`}
                  placeholder="Enter Set"
                />
                {(setExistsError || fieldErrors.setNumber) && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E9424C] font-bold text-sm">
                    !
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label
                className={`text-xs font-black whitespace-nowrap ${labelErr('year')}`}
              >
                Year
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                  className={`w-20 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[9px] pr-7 ${
                    setExistsError || fieldErrors.year
                      ? 'border-[#E9424C]'
                      : 'border-[#151313]'
                  }`}
                  placeholder="Enter Year"
                />
                {(setExistsError || fieldErrors.year) && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E9424C] font-bold text-sm">
                    !
                  </span>
                )}
              </div>
            </div>

            {setExistsError && (
              <p className="text-[10px] text-[#E9424C] font-medium whitespace-nowrap">
                Set {editableSetNumber} ({year}) already exists
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
              const part = parseInt(v)
              setSelectedPart(part)
              loadPassageStateForPart(part, allQuestions)
            }}
          >
            <TabsList className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 w-full mb-6 flex flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
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
              <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Part {selectedPart}
              </span>

              <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
                <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
                  <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                    Passage
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {renderPassageEditor()}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                  QUESTIONS ({currentPartQuestions.length}/
                  {PART_CONFIG[selectedPart].questions})
                </span>

                <div className="space-y-4">
                  {currentPartQuestions.map((q, idx) => (
                    <QuestionCard
                      key={`${q.part_number}-${q.question_number}`}
                      q={q}
                      idx={idx}
                      total={currentPartQuestions.length}
                      selectedPart={selectedPart}
                      fieldErrors={fieldErrors}
                      updateOption={updateOption}
                      updateCorrectAnswer={updateCorrectAnswer}
                      removeQuestion={removeQuestion}
                      moveQuestion={moveQuestion}
                      errKey={errKey}
                      labelErr={labelErr}
                      ErrMsg={ErrMsg}
                    />
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    disabled={
                      currentPartQuestions.length >=
                      PART_CONFIG[selectedPart].questions
                    }
                    className={`border-2 rounded-xl text-xs font-black px-6 ${
                      currentPartQuestions.length >=
                      PART_CONFIG[selectedPart].questions
                        ? 'border-[#151313]/30 text-[#151313]/30 cursor-not-allowed'
                        : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'
                    }`}
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
