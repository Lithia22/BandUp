import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '../../../../services/api'
import { toast } from 'sonner'
import { QuestionCardSkeleton } from '../../../../components/layouts/Skeletons'
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'

// Part configurations
const PART_CONFIG = {
  1: {
    name: 'Part 1 - Three Notices',
    questions: 4,
    passageType: 'three_column_table',
    description: 'Compare three notices (A, B, C)',
    template: {
      type: 'three_column_table',
      columns: [
        { label: 'A', title: '', body: '', details: '', footer: '' },
        { label: 'B', title: '', body: '', details: '', footer: '' },
        { label: 'C', title: '', body: '', details: '', footer: '' },
      ],
    },
  },
  2: {
    name: 'Part 2 - Email',
    questions: 5,
    passageType: 'plain',
    description: 'Email with To:/From:/Subject:',
  },
  3: {
    name: 'Part 3 - Short Story',
    questions: 5,
    passageType: 'plain',
    description: 'Short story with numbered paragraphs',
  },
  4: {
    name: 'Part 4 - Two Texts',
    questions: 6,
    passageType: 'two_texts',
    description: 'Compare two texts',
    template: {
      type: 'two_texts',
      texts: [
        {
          label: 'Text 1',
          paragraphs: [
            { number: 1, text: '' },
            { number: 2, text: '' },
            { number: 3, text: '' },
          ],
        },
        {
          label: 'Text 2',
          paragraphs: [
            { number: 1, text: '' },
            { number: 2, text: '' },
            { number: 3, text: '' },
          ],
        },
      ],
    },
  },
  5: {
    name: 'Part 5 - Gapped Text',
    questions: 6,
    passageType: 'gapped_text',
    description: 'Fill in the blanks with sentences A-G',
    template: {
      type: 'gapped_text',
      main_text:
        '1\tLike many of us, when I wake up, I reach for the phone. 01___\n\n2\tBy the time I reach the office, my phone already needs charging. 02___\n\n3\tThe lithium-ion batteries that power most of our devices have a major drawback. 03___\n\n4\tProfessor Clare Grey at Cambridge University is working on a solution. 04___\n\n5\tHer team is developing batteries that could charge in minutes. 05___\n\n6\tThis technology could revolutionise electric vehicles. 06___',
      sentences: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
        { key: 'E', text: '' },
        { key: 'F', text: '' },
        { key: 'G', text: '' },
      ],
    },
  },
  6: {
    name: 'Part 6 - Complex Article',
    questions: 7,
    passageType: 'lined_text',
    description: 'Article with line numbers',
    template: {
      type: 'lined_text',
      paragraphs: [
        { number: 1, lines: '1-9', text: '' },
        { number: 2, lines: '10-18', text: '' },
        { number: 3, lines: '19-27', text: '' },
        { number: 4, lines: '28-36', text: '' },
        { number: 5, lines: '37-45', text: '' },
        { number: 6, lines: '46-54', text: '' },
        { number: 7, lines: '55-63', text: '' },
      ],
    },
  },
  7: {
    name: 'Part 7 - Complex Article',
    questions: 7,
    passageType: 'lined_text',
    description: 'Article with line numbers',
    template: {
      type: 'lined_text',
      paragraphs: [
        { number: 1, lines: '1-8', text: '' },
        { number: 2, lines: '9-16', text: '' },
        { number: 3, lines: '17-24', text: '' },
        { number: 4, lines: '25-32', text: '' },
        { number: 5, lines: '33-40', text: '' },
        { number: 6, lines: '41-48', text: '' },
        { number: 7, lines: '49-56', text: '' },
      ],
    },
  },
}

const QUESTION_TEMPLATE = {
  question_number: 1,
  question_text: '',
  options: { A: '', B: '', C: '' },
  correct_answer: 'A',
}

export default function AdminReadingEditor() {
  const navigate = useNavigate()
  const { setNumber } = useParams()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')

  const [selectedPart, setSelectedPart] = useState(1)
  const [passageData, setPassageData] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [editableSetNumber, setEditableSetNumber] = useState(setNumber || '')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Load existing set or draft
  useEffect(() => {
    if (setNumber) {
      loadSet(setNumber)
      setEditableSetNumber(setNumber)
    } else if (draftId) {
      loadDraft(draftId)
    } else {
      // New set - initialize with Part 1
      setPassageData(PART_CONFIG[1].template || null)
      setQuestions(generateQuestionsForPart(1))
    }
  }, [setNumber, draftId])

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(true)
  }, [passageData, questions, year, editableSetNumber])

  const loadSet = async (setNum) => {
    setLoading(true)
    try {
      const res = await api.get(`/reading/sets/${setNum}`)
      const questions = res.data.questions

      if (questions.length > 0) {
        const firstQ = questions[0]
        setYear(firstQ.year || new Date().getFullYear())

        if (firstQ.passage) {
          try {
            setPassageData(JSON.parse(firstQ.passage))
          } catch {
            setPassageData({ type: 'plain', text: firstQ.passage })
          }
        }

        // Group questions by part
        const sorted = questions.sort((a, b) => a.part_number - b.part_number)
        setQuestions(
          sorted.map((q) => ({
            id: q.id,
            question_number: q.question_number,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            part_number: q.part_number,
          }))
        )

        // Set to first part
        setSelectedPart(sorted[0]?.part_number || 1)
      }
    } catch (error) {
      toast.error('Failed to load set')
    } finally {
      setLoading(false)
      setUnsavedChanges(false)
    }
  }

  const loadDraft = (id) => {
    try {
      const draft = JSON.parse(localStorage.getItem(`reading_draft_${id}`))
      if (draft) {
        setPassageData(draft.passageData)
        setQuestions(draft.questions)
        setSelectedPart(draft.selectedPart || 1)
        setYear(draft.year || new Date().getFullYear())
        setEditableSetNumber(draft.setNumber || '')
        toast.info('Draft loaded')
        setUnsavedChanges(false)
      }
    } catch (error) {
      toast.error('Failed to load draft')
    }
  }

  const generateQuestionsForPart = (part) => {
    const config = PART_CONFIG[part]
    const qs = []
    for (let i = 1; i <= config.questions; i++) {
      qs.push({
        ...QUESTION_TEMPLATE,
        question_number: i,
        part_number: part,
        options:
          part >= 5 ? { A: '', B: '', C: '', D: '' } : { A: '', B: '', C: '' },
      })
    }
    return qs
  }

  const handlePartChange = (part) => {
    const newPart = parseInt(part)
    setSelectedPart(newPart)

    // Check if we already have questions for this part
    const existingQs = questions.filter((q) => q.part_number === newPart)
    if (existingQs.length > 0) {
      setQuestions(existingQs)
    } else {
      setQuestions(generateQuestionsForPart(newPart))
    }

    // Load template for this part if no passage data
    if (!passageData) {
      setPassageData(PART_CONFIG[newPart].template || null)
    }
  }

  const updateQuestion = (index, field, value) => {
    const updated = [...questions]
    updated[index][field] = value
    setQuestions(updated)
  }

  const updateOption = (qIndex, optKey, value) => {
    const updated = [...questions]
    updated[qIndex].options = { ...updated[qIndex].options, [optKey]: value }
    setQuestions(updated)
  }

  const addQuestion = () => {
    const newQ = {
      ...QUESTION_TEMPLATE,
      question_number: questions.length + 1,
      part_number: selectedPart,
      options:
        selectedPart >= 5
          ? { A: '', B: '', C: '', D: '' }
          : { A: '', B: '', C: '' },
    }
    setQuestions([...questions, newQ])
  }

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index)
    // Renumber questions
    updated.forEach((q, i) => {
      q.question_number = i + 1
    })
    setQuestions(updated)
  }

  const updatePassageField = (path, value) => {
    if (!passageData) return

    if (passageData.type === 'plain') {
      setPassageData({ type: 'plain', text: value })
      return
    }

    const updated = { ...passageData }
    const parts = path.split('.')
    let current = updated
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    setPassageData(updated)
  }

  const saveSet = async () => {
    setSaving(true)
    try {
      // Use editable set number or generate new one
      let targetSetNumber = editableSetNumber
      if (!targetSetNumber) {
        const setsRes = await api.get('/reading/sets')
        const maxSet = Math.max(
          ...setsRes.data.sets.map((s) => s.set_number),
          0
        )
        targetSetNumber = (maxSet + 1).toString()
      }

      // Save each question
      for (const q of questions) {
        const questionData = {
          component: 'reading',
          set_number: parseInt(targetSetNumber),
          part_number: selectedPart,
          question_number: q.question_number,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          passage:
            passageData?.type === 'plain'
              ? passageData.text
              : JSON.stringify(passageData),
          passage_title: `Part ${selectedPart} - ${PART_CONFIG[selectedPart].name}`,
          year,
        }

        if (q.id) {
          await api.put(`/admin/questions/${q.id}`, questionData)
        } else {
          await api.post('/admin/questions', questionData)
        }
      }

      // Clear draft if this was a draft
      if (draftId) {
        localStorage.removeItem(`reading_draft_${draftId}`)
      }

      toast.success(`Set ${targetSetNumber} saved successfully!`)
      navigate('/admin/reading')
    } catch (error) {
      toast.error('Failed to save set')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (unsavedChanges) {
      setShowExitDialog(true)
    } else {
      navigate('/admin/reading')
    }
  }

  const renderPassageEditor = () => {
    const config = PART_CONFIG[selectedPart]

    if (config.passageType === 'plain') {
      return (
        <div className="space-y-4">
          <Label>Passage Text</Label>
          <Textarea
            value={passageData?.text || ''}
            onChange={(e) =>
              setPassageData({ type: 'plain', text: e.target.value })
            }
            rows={10}
            className="font-mono text-sm border-2 border-[#151313] rounded-xl focus-visible:border-[#E9424C]"
            placeholder="Paste the passage here..."
          />
        </div>
      )
    }

    if (config.passageType === 'three_column_table') {
      const data = passageData || config.template
      return (
        <div className="space-y-6">
          <p className="text-sm font-medium text-[#151313]/60">
            Three notices (A, B, C)
          </p>
          <div className="grid grid-cols-3 gap-4">
            {['A', 'B', 'C'].map((label, idx) => (
              <div
                key={label}
                className="bg-white border-2 border-[#151313] rounded-2xl p-4"
              >
                <h3 className="text-sm font-black text-[#151313] mb-3">
                  Notice {label}
                </h3>
                <div className="space-y-2">
                  <Input
                    value={data.columns?.[idx]?.title || ''}
                    onChange={(e) =>
                      updatePassageField(`columns.${idx}.title`, e.target.value)
                    }
                    className="border-2 border-[#151313] rounded-xl"
                    placeholder="Title"
                  />
                  <Textarea
                    value={data.columns?.[idx]?.body || ''}
                    onChange={(e) =>
                      updatePassageField(`columns.${idx}.body`, e.target.value)
                    }
                    rows={3}
                    className="border-2 border-[#151313] rounded-xl"
                    placeholder="Body"
                  />
                  <Textarea
                    value={data.columns?.[idx]?.details || ''}
                    onChange={(e) =>
                      updatePassageField(
                        `columns.${idx}.details`,
                        e.target.value
                      )
                    }
                    rows={2}
                    className="border-2 border-[#151313] rounded-xl"
                    placeholder="Details"
                  />
                  <Input
                    value={data.columns?.[idx]?.footer || ''}
                    onChange={(e) =>
                      updatePassageField(
                        `columns.${idx}.footer`,
                        e.target.value
                      )
                    }
                    className="border-2 border-[#151313] rounded-xl"
                    placeholder="Footer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (config.passageType === 'gapped_text') {
      const data = passageData || config.template
      return (
        <div className="space-y-6">
          <div>
            <Label>Main Text (use 01___, 02___, etc. for gaps)</Label>
            <Textarea
              value={data.main_text || ''}
              onChange={(e) => updatePassageField('main_text', e.target.value)}
              rows={8}
              className="font-mono text-sm border-2 border-[#151313] rounded-xl"
            />
          </div>
          <div>
            <Label>Sentences A-G</Label>
            <div className="grid grid-cols-1 gap-2">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="font-black w-6">{key}.</span>
                  <Input
                    value={
                      data.sentences?.find((s) => s.key === key)?.text || ''
                    }
                    onChange={(e) => {
                      const sentences = [...(data.sentences || [])]
                      const idx = sentences.findIndex((s) => s.key === key)
                      if (idx >= 0) {
                        sentences[idx].text = e.target.value
                      } else {
                        sentences.push({ key, text: e.target.value })
                      }
                      updatePassageField('sentences', sentences)
                    }}
                    className="border-2 border-[#151313] rounded-xl"
                    placeholder={`Sentence ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (
      config.passageType === 'lined_text' ||
      config.passageType === 'two_texts'
    ) {
      const data = passageData || config.template
      return (
        <div className="space-y-4">
          {config.passageType === 'lined_text' && (
            <p className="text-sm font-medium text-[#151313]/60">
              Paragraphs with line numbers
            </p>
          )}
          {data.paragraphs?.map((para, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="w-16">
                <Input
                  value={para.lines || ''}
                  onChange={(e) =>
                    updatePassageField(
                      `paragraphs.${idx}.lines`,
                      e.target.value
                    )
                  }
                  placeholder="1-9"
                  className="border-2 border-[#151313] rounded-xl text-xs"
                />
              </div>
              <Textarea
                value={para.text || ''}
                onChange={(e) =>
                  updatePassageField(`paragraphs.${idx}.text`, e.target.value)
                }
                rows={2}
                className="flex-1 border-2 border-[#151313] rounded-xl text-sm"
                placeholder={`Paragraph ${para.number || idx + 1}`}
              />
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#151313] bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-gray-200 animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
          {[1, 2, 3].map((i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
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

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-black text-[#151313]">Set</Label>
            <Input
              type="number"
              value={editableSetNumber}
              onChange={(e) => setEditableSetNumber(e.target.value)}
              className="w-20 border-2 border-[#151313] rounded-xl text-xs font-black h-8"
              placeholder="Set #"
              min="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-black text-[#151313]">Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-20 border-2 border-[#151313] rounded-xl text-xs font-black h-8"
              placeholder="Year"
            />
          </div>
          <Button
            onClick={saveSet}
            disabled={saving}
            className="bg-[#E9424C] text-white font-black text-xs border-2 border-[#151313] rounded-xl px-4 py-2 shadow-[2px_2px_0px_#151313] shrink-0 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Part Tabs */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
        <Tabs value={selectedPart.toString()} onValueChange={handlePartChange}>
          <TabsList className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 w-auto mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <TabsTrigger
                key={p}
                value={p.toString()}
                className="text-[10px] font-black rounded-lg px-3 py-1.5 data-[state=active]:bg-[#151313] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_#E9424C] transition-all"
              >
                Part {p}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedPart.toString()} className="space-y-6">
            <>
              {/* Passage Editor */}
              <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]">
                <h3 className="text-xs font-black text-[#151313] uppercase tracking-widest mb-4">
                  Passage
                </h3>
                {renderPassageEditor()}
              </div>

              {/* Questions Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#151313] uppercase tracking-widest">
                    Questions
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="border-2 border-[#151313] rounded-xl text-xs font-black"
                  >
                    <Plus size={14} className="mr-1" /> Add Question
                  </Button>
                </div>

                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#151313]">
                        <span className="text-[#E9424C] mr-2">
                          {q.question_number}.
                        </span>
                        Question
                      </h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newQ = { ...q, id: undefined }
                            setQuestions([...questions, newQ])
                          }}
                          className="text-[#151313] hover:text-[#E9424C]"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(idx)}
                          className="text-[#E9424C] hover:text-[#E9424C]"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Input
                        value={q.question_text}
                        onChange={(e) =>
                          updateQuestion(idx, 'question_text', e.target.value)
                        }
                        className="border-2 border-[#151313] rounded-xl text-sm"
                        placeholder="Enter question text..."
                      />

                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(q.options).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="font-black text-sm w-6">
                              {key}.
                            </span>
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateOption(idx, key, e.target.value)
                              }
                              className="border-2 border-[#151313] rounded-xl text-sm"
                              placeholder={`Option ${key}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                          Correct Answer
                        </Label>
                        <Select
                          value={q.correct_answer}
                          onValueChange={(v) =>
                            updateQuestion(idx, 'correct_answer', v)
                          }
                        >
                          <SelectTrigger className="border-2 border-[#151313] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(q.options).map((key) => (
                              <SelectItem key={key} value={key}>
                                Option {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
