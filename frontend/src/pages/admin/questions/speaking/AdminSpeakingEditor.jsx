import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import api from '../../../../services/api'
import { toast } from 'sonner'
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'
import { QuestionCardSkeleton } from '../../../../components/layouts/Skeletons'

const CANDIDATE_LETTERS = ['A', 'B', 'C', 'D']

const defaultCandidate = (num) => ({
  question_number: num,
  question_text: '',
  options: { candidate: CANDIDATE_LETTERS[num - 1] },
})

const defaultBooklet = (partNum) => ({
  part_number: partNum,
  passage_title: `Booklet ${partNum}`,
  passage: '',
  candidates: [1, 2, 3, 4].map(defaultCandidate),
})

export default function AdminSpeakingEditor() {
  const navigate = useNavigate()
  const { setNumber } = useParams()
  const [searchParams] = useSearchParams()
  const urlYear = searchParams.get('year')
  const draftId = searchParams.get('draft')

  const isMounted = useRef(true)
  const isSaving = useRef(false)
  const firstLoad = useRef(true)
  const sessionDraftId = useRef(
    draftId || `speaking_draft_${setNumber || 'new'}`
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [setExistsError, setSetExistsError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [year, setYear] = useState(new Date().getFullYear())
  const [editableSetNumber, setEditableSetNumber] = useState(setNumber || '')
  const [booklets, setBooklets] = useState([defaultBooklet(1)])
  const [expandedBooklets, setExpandedBooklets] = useState({ 0: true })

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (firstLoad.current) return
    setUnsavedChanges(true)
  }, [booklets, year, editableSetNumber])

  const autoSave = useCallback(() => {
    if (setNumber) return
    try {
      localStorage.setItem(
        `speaking_admin_draft_${sessionDraftId.current}`,
        JSON.stringify({
          booklets,
          year,
          editableSetNumber,
          timestamp: Date.now(),
        })
      )
    } catch {}
  }, [booklets, year, editableSetNumber, setNumber])

  useEffect(() => {
    if (setNumber) return
    const timer = setTimeout(autoSave, 1500)
    const interval = setInterval(autoSave, 5000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [autoSave])

  const loadSet = async (setNum, yearParam) => {
    setLoading(true)
    try {
      const res = await api.get(
        `/admin/questions?component=speaking&set_number=${setNum}&year=${yearParam}`
      )
      if (!isMounted.current) return
      const questions = res.data.questions || []
      if (!questions.length) return

      setYear(parseInt(yearParam))
      setEditableSetNumber(setNum)

      const byPart = {}
      for (const q of questions) {
        const p = q.part_number
        if (!byPart[p]) byPart[p] = []
        byPart[p].push(q)
      }

      const loaded = Object.keys(byPart)
        .map(Number)
        .sort((a, b) => a - b)
        .map((partNum, idx) => {
          const qs = byPart[partNum].sort(
            (a, b) => a.question_number - b.question_number
          )
          const first = qs[0]
          const candidates = [1, 2, 3, 4].map((num) => {
            const found = qs.find((q) => q.question_number === num)
            return found
              ? {
                  id: found.id,
                  question_number: found.question_number,
                  question_text: found.question_text || '',
                  options: found.options || {
                    candidate: CANDIDATE_LETTERS[num - 1],
                  },
                }
              : defaultCandidate(num)
          })
          return {
            part_number: partNum,
            passage_title: first.passage_title || `Booklet ${idx + 1}`,
            passage: first.passage || '',
            candidates,
          }
        })

      setBooklets(loaded)
      const exp = {}
      loaded.forEach((_, i) => {
        exp[i] = true
      })
      setExpandedBooklets(exp)
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
      const saved = localStorage.getItem(`speaking_admin_draft_${id}`)
      if (!saved) {
        firstLoad.current = false
        return
      }
      const d = JSON.parse(saved)
      setBooklets(d.booklets || [defaultBooklet(1)])
      setYear(d.year || new Date().getFullYear())
      setEditableSetNumber(d.editableSetNumber || '')
      const exp = {}
      ;(d.booklets || []).forEach((_, i) => {
        exp[i] = true
      })
      setExpandedBooklets(exp)
    } catch {}
    firstLoad.current = false
  }

  useEffect(() => {
    if (setNumber && urlYear) {
      loadSet(setNumber, urlYear)
    } else if (draftId) {
      loadDraft(draftId)
    } else {
      loadDraft(sessionDraftId.current)
    }
  }, [setNumber, draftId, urlYear])

  useEffect(() => {
    const check = async () => {
      if (!editableSetNumber || !year) {
        setSetExistsError('')
        return
      }
      if (
        setNumber &&
        String(editableSetNumber) === String(setNumber) &&
        parseInt(year) === parseInt(urlYear)
      ) {
        setSetExistsError('')
        return
      }
      try {
        const res = await api.get('/speaking/sets')
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
  }, [editableSetNumber, year, setNumber, urlYear])

  const addBooklet = () => {
    const nextPart = booklets.length + 1
    setBooklets((prev) => [...prev, defaultBooklet(nextPart)])
    setExpandedBooklets((prev) => ({ ...prev, [booklets.length]: true }))
  }

  const removeBooklet = (idx) => {
    if (booklets.length <= 1) {
      toast.error('A set must have at least one booklet')
      return
    }
    setBooklets((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((b, i) => ({ ...b, part_number: i + 1 }))
    )
    setExpandedBooklets((prev) => {
      const next = {}
      Object.keys(prev).forEach((k) => {
        const n = parseInt(k)
        if (n < idx) next[n] = prev[k]
        else if (n > idx) next[n - 1] = prev[k]
      })
      return next
    })
  }

  const updateBooklet = (idx, field, val) => {
    setBooklets((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: val } : b))
    )
    setFieldErrors((p) => {
      const n = { ...p }
      delete n[`b${idx}_${field}`]
      return n
    })
  }

  const updateCandidate = (bIdx, cIdx, val) => {
    setBooklets((prev) =>
      prev.map((b, i) => {
        if (i !== bIdx) return b
        return {
          ...b,
          candidates: b.candidates.map((c, j) =>
            j === cIdx ? { ...c, question_text: val } : c
          ),
        }
      })
    )
    setFieldErrors((p) => {
      const n = { ...p }
      delete n[`b${bIdx}_c${cIdx}_text`]
      return n
    })
  }

  const validate = () => {
    const e = {}
    if (!editableSetNumber?.toString().trim())
      e.setNumber = 'Set number is required'
    if (!year?.toString().trim()) e.year = 'Year is required'
    booklets.forEach((b, bIdx) => {
      if (!b.passage_title?.trim())
        e[`b${bIdx}_passage_title`] = `Booklet ${bIdx + 1} title is required`
      if (!b.passage?.trim())
        e[`b${bIdx}_passage`] = `Booklet ${bIdx + 1} situation is required`
      b.candidates.forEach((c, cIdx) => {
        if (!c.question_text?.trim())
          e[`b${bIdx}_c${cIdx}_text`] =
            `Booklet ${bIdx + 1} — Candidate ${CANDIDATE_LETTERS[cIdx]} task is required`
      })
    })
    setFieldErrors(e)
    if (Object.keys(e).length > 0) {
      const exp = { ...expandedBooklets }
      booklets.forEach((_, bIdx) => {
        if (Object.keys(e).some((k) => k.startsWith(`b${bIdx}_`)))
          exp[bIdx] = true
      })
      setExpandedBooklets(exp)
    }
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
        const res = await api.get('/speaking/sets')
        targetSet = (
          Math.max(...(res.data.sets?.map((s) => s.set_number) || [0]), 0) + 1
        ).toString()
      }

      if (setNumber && urlYear) {
        await api.delete(
          `/admin/questions?component=speaking&set_number=${targetSet}&year=${urlYear}`
        )
      }

      for (const booklet of booklets) {
        for (const candidate of booklet.candidates) {
          const payload = {
            component: 'speaking',
            set_number: parseInt(targetSet),
            part_number: booklet.part_number,
            question_number: candidate.question_number,
            question_text: candidate.question_text,
            passage_title: booklet.passage_title,
            passage: booklet.passage,
            options: candidate.options,
            correct_answer: null,
            year: parseInt(year),
          }
          await api.post('/admin/questions', payload)
        }
      }

      localStorage.removeItem(`speaking_admin_draft_${sessionDraftId.current}`)
      setUnsavedChanges(false)
      toast.success(`Set ${targetSet} (${year}) saved!`)
      navigate('/admin/speaking')
    } catch (err) {
      toast.error(
        'Failed to save: ' +
          (err?.response?.data?.detail || err.message || 'Unknown error')
      )
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#151313] bg-gray-200 animate-pulse" />
        </div>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
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
            navigate('/admin/speaking')
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
                : navigate('/admin/speaking')
            }
            className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Button>
          <p className="text-[10px] font-semibold text-[#151313]/40 flex-1 min-w-[200px]">
            Editing Set {editableSetNumber || 'New'} ({year || 'Year'}) •
            Speaking • {booklets.length} booklet
            {booklets.length !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 bg-white border-2 border-[#151313] rounded-xl px-3 py-1.5">
                  <span className="text-xs font-black text-[#151313]/60">
                    Duration:
                  </span>
                  <span className="text-xs font-black text-[#151313]">
                    4 min
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>2 min prep + 2 min speaking per candidate</p>
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
                className={`w-24 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[11px] ${
                  setExistsError || fieldErrors.setNumber
                    ? 'border-[#E9424C]'
                    : 'border-[#151313]'
                }`}
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
                className={`w-20 border-2 rounded-xl text-xs font-black h-8 placeholder:text-[9px] ${
                  setExistsError || fieldErrors.year
                    ? 'border-[#E9424C]'
                    : 'border-[#151313]'
                }`}
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

        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 pb-12 space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Speaking Booklets
            </span>
            <p className="text-[10px] font-medium text-[#151313]/40">
              Each booklet = 1 situation + 4 candidate tasks
            </p>
          </div>

          {booklets.map((booklet, bIdx) => {
            const isExpanded = !!expandedBooklets[bIdx]
            const hasErr = Object.keys(fieldErrors).some((k) =>
              k.startsWith(`b${bIdx}_`)
            )
            return (
              <Card
                key={bIdx}
                className={`border-2 rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden ${
                  hasErr ? 'border-[#E9424C]' : 'border-[#151313]'
                }`}
              >
                <CardHeader
                  className="border-b-2 border-[#151313] bg-white py-0 cursor-pointer select-none"
                  onClick={() =>
                    setExpandedBooklets((prev) => ({
                      ...prev,
                      [bIdx]: !prev[bIdx],
                    }))
                  }
                >
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shrink-0">
                        <BookOpen size={12} className="text-white" />
                      </div>
                      <CardTitle className="text-sm font-black text-[#151313]">
                        Booklet {bIdx + 1}
                        {booklet.passage_title &&
                          booklet.passage_title !== `Booklet ${bIdx + 1}` && (
                            <span className="font-medium text-[#151313]/50 ml-2 text-xs">
                              — {booklet.passage_title}
                            </span>
                          )}
                      </CardTitle>
                      {hasErr && (
                        <span className="text-[9px] font-black text-white bg-[#E9424C] px-2 py-0.5 rounded-full">
                          Errors
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBooklet(bIdx)
                        }}
                        className="w-7 h-7 p-0 text-[#E9424C] hover:text-[#E9424C] hover:bg-[#E9424C]/10"
                      >
                        <Trash2 size={13} />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-[#151313]/40" />
                      ) : (
                        <ChevronDown size={14} className="text-[#151313]/40" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-5 space-y-5">
                    {/* Booklet title */}
                    <div className="space-y-1">
                      <Label
                        className={`text-xs font-black uppercase tracking-widest ${labelErr(`b${bIdx}_passage_title`)}`}
                      >
                        Booklet Title
                      </Label>
                      <Input
                        value={booklet.passage_title}
                        onChange={(e) =>
                          updateBooklet(bIdx, 'passage_title', e.target.value)
                        }
                        className={`border-2 rounded-xl text-sm ${errKey(`b${bIdx}_passage_title`)}`}
                        placeholder={`e.g. Booklet ${bIdx + 1} — Technology`}
                      />
                      <ErrMsg k={`b${bIdx}_passage_title`} />
                    </div>

                    {/* Shared situation */}
                    <div className="space-y-1">
                      <Label
                        className={`text-xs font-black uppercase tracking-widest ${labelErr(`b${bIdx}_passage`)}`}
                      >
                        Shared Situation
                      </Label>
                      <p className="text-[10px] text-[#151313]/40 font-medium">
                        This is shown to all 4 candidates before their
                        individual task.
                      </p>
                      <Textarea
                        value={booklet.passage}
                        onChange={(e) =>
                          updateBooklet(bIdx, 'passage', e.target.value)
                        }
                        rows={2}
                        className={`border-2 rounded-xl text-sm ${errKey(`b${bIdx}_passage`)}`}
                        placeholder="e.g. Technology helps us in many ways. What are some of these ways?"
                      />
                      <ErrMsg k={`b${bIdx}_passage`} />
                    </div>

                    {/* Candidates A–D */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-black uppercase tracking-widest text-[#151313]">
                          Candidate Tasks (A – D)
                        </Label>
                        <p className="text-[10px] text-[#151313]/40 font-medium mt-0.5">
                          Each candidate presents on a different subtopic.
                        </p>
                      </div>

                      {booklet.candidates.map((candidate, cIdx) => {
                        const letter = CANDIDATE_LETTERS[cIdx]
                        const errK = `b${bIdx}_c${cIdx}_text`
                        return (
                          <div
                            key={cIdx}
                            className={`border-2 rounded-xl p-4 space-y-2 bg-[#f7f7f5] ${
                              fieldErrors[errK]
                                ? 'border-[#E9424C]'
                                : 'border-[#151313]/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#151313] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-white">
                                  {letter}
                                </span>
                              </div>
                              <span className="text-xs font-black text-[#151313]">
                                Candidate {letter}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Label
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                  fieldErrors[errK]
                                    ? 'text-[#E9424C]'
                                    : 'text-[#151313]/50'
                                }`}
                              >
                                Presentation Task
                              </Label>
                              <Textarea
                                value={candidate.question_text}
                                onChange={(e) =>
                                  updateCandidate(bIdx, cIdx, e.target.value)
                                }
                                rows={2}
                                className={`border-2 rounded-xl text-sm bg-white ${
                                  fieldErrors[errK]
                                    ? 'border-[#E9424C]'
                                    : 'border-[#151313]/30 focus-visible:border-[#151313]'
                                }`}
                                placeholder={`e.g. You have to give a presentation to your class. Talk about how technology helps us ${
                                  [
                                    'do housework',
                                    'make friends',
                                    'shop online',
                                    'find entertainment',
                                  ][cIdx]
                                }.`}
                              />
                              <ErrMsg k={errK} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}

          <Button
            type="button"
            variant="outline"
            onClick={addBooklet}
            className="w-full border-2 border-dashed border-[#151313]/30 rounded-2xl py-4 text-xs font-black text-[#151313]/50 hover:border-[#151313] hover:text-[#151313] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Booklet
          </Button>

          <div className="pb-6" />
        </div>
      </div>
    </TooltipProvider>
  )
}
