import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'

const newPara = (id) => ({ id, text: '', note: '' })

const defaultState = () => ({
  context: '',
  from: '',
  subject: '',
  paragraphs: [
    { id: 1, text: '', note: '' },
    { id: 2, text: '', note: '' },
    { id: 3, text: '', note: '' },
    { id: 4, text: '', note: '' },
    { id: 5, text: '', note: '' },
    { id: 6, text: '', note: '' },
  ],
  notes: { note1: '', note2: '', note3: '', note4: '' },
})

export default function AdminWritingEditor() {
  const navigate = useNavigate()
  const { setNumber } = useParams()
  const [searchParams] = useSearchParams()
  const urlYear = searchParams.get('year')
  const draftId = searchParams.get('draft')
  const isMounted = useRef(true)
  const isSaving = useRef(false)
  const firstLoad = useRef(true)
  const sessionDraftId = useRef(
    draftId || `writing_draft_${setNumber || 'new'}`
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [setExistsError, setSetExistsError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [year, setYear] = useState(new Date().getFullYear())
  const [editableSetNumber, setEditableSetNumber] = useState(setNumber || '')

  // Email content
  const [context, setContext] = useState('')
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [paragraphs, setParagraphs] = useState(defaultState().paragraphs)
  const [notes, setNotes] = useState({
    note1: '',
    note2: '',
    note3: '',
    note4: '',
  })

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (firstLoad.current) return
    setUnsavedChanges(true)
  }, [context, from, subject, paragraphs, notes, year, editableSetNumber])

  const autoSave = useCallback(() => {
    if (setNumber) return
    try {
      localStorage.setItem(
        `writing_admin_draft_${sessionDraftId.current}`,
        JSON.stringify({
          context,
          from,
          subject,
          paragraphs,
          notes,
          year,
          editableSetNumber,
          timestamp: Date.now(),
        })
      )
    } catch {}
  }, [
    context,
    from,
    subject,
    paragraphs,
    notes,
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

  const loadSet = async (setNum, yearParam) => {
    setLoading(true)
    try {
      const res = await api.get(`/writing/sets/${setNum}?year=${yearParam}`)
      if (!isMounted.current) return
      const q = res.data.question
      if (!q) return

      setYear(q.year || new Date().getFullYear())
      setEditableSetNumber(setNum)

      if (q.passage) {
        try {
          const p = JSON.parse(q.passage)
          setContext(p.context || '')
          setFrom(p.from || '')
          setSubject(p.subject || '')
          setParagraphs(
            p.paragraphs?.length ? p.paragraphs : defaultState().paragraphs
          )
        } catch {}
      }
      if (q.options) {
        setNotes({
          note1: q.options.note1 || '',
          note2: q.options.note2 || '',
          note3: q.options.note3 || '',
          note4: q.options.note4 || '',
        })
      }
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
      const saved = localStorage.getItem(`writing_admin_draft_${id}`)
      if (!saved) return
      const d = JSON.parse(saved)
      setContext(d.context || '')
      setFrom(d.from || '')
      setSubject(d.subject || '')
      setParagraphs(d.paragraphs || defaultState().paragraphs)
      setNotes(d.notes || { note1: '', note2: '', note3: '', note4: '' })
      setYear(d.year || new Date().getFullYear())
      setEditableSetNumber(d.editableSetNumber || '')
    } catch {}
    firstLoad.current = false
  }

  useEffect(() => {
    if (setNumber) {
      loadSet(setNumber, urlYear)
      setEditableSetNumber(setNumber)
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
        year === parseInt(urlYear)
      ) {
        setSetExistsError('')
        return
      }
      try {
        const res = await api.get('/writing/sets')
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

  const updatePara = (idx, field, val) => {
    setParagraphs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    )
    setFieldErrors((p) => {
      const n = { ...p }
      delete n[`para_${idx}_text`]
      return n
    })
  }

  const addPara = () => {
    const newId = Math.max(...paragraphs.map((p) => p.id), 0) + 1
    setParagraphs((prev) => [...prev, newPara(newId)])
  }

  const removePara = (idx) => {
    if (paragraphs.length <= 2) {
      toast.error('Need at least 2 paragraphs')
      return
    }
    setParagraphs((prev) => prev.filter((_, i) => i !== idx))
  }

  const validate = () => {
    const e = {}
    if (!editableSetNumber?.toString().trim())
      e.setNumber = 'Set number is required'
    if (!year?.toString().trim()) e.year = 'Year is required'
    if (!context.trim()) e.context = 'Context sentence is required'
    if (!from.trim()) e.from = 'From field is required'
    if (!subject.trim()) e.subject = 'Subject is required'
    paragraphs.forEach((p, idx) => {
      if (!p.text.trim())
        e[`para_${idx}_text`] = `Paragraph ${idx + 1} text is required`
    })
    const notedParas = paragraphs.filter((p) => p.note?.trim())
    if (notedParas.length !== 4)
      e.notes = `Exactly 4 paragraphs must have notes (currently ${notedParas.length})`
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
        const res = await api.get('/writing/sets')
        targetSet = (
          Math.max(...(res.data.sets?.map((s) => s.set_number) || [0]), 0) + 1
        ).toString()
      }

      const notedParas = paragraphs.filter((p) => p.note?.trim())
      const builtNotes = {
        note1: notedParas[0]?.note || '',
        note2: notedParas[1]?.note || '',
        note3: notedParas[2]?.note || '',
        note4: notedParas[3]?.note || '',
      }

      const passage = JSON.stringify({
        type: 'email_task',
        context,
        from,
        subject,
        paragraphs: paragraphs.map((p, i) => ({
          id: i + 1,
          text: p.text,
          ...(p.note?.trim() ? { note: p.note } : {}),
        })),
      })

      const payload = {
        component: 'writing',
        set_number: parseInt(targetSet),
        part_number: 1,
        question_number: 1,
        question_text:
          'Using all the notes given, write a reply of at least 100 words in an appropriate style.',
        passage,
        options: builtNotes,
        year: parseInt(year),
      }

      const existing = await api.get(
        '/admin/questions?component=writing&set_number=' +
          targetSet +
          '&year=' +
          year
      )
      const existingQ = existing.data.questions?.find(
        (q) => q.set_number === parseInt(targetSet) && q.year === parseInt(year)
      )

      if (existingQ?.id) {
        await api.put(`/admin/questions/${existingQ.id}`, payload)
      } else {
        await api.post('/admin/questions', payload)
      }

      localStorage.removeItem(`writing_admin_draft_${sessionDraftId.current}`)
      setUnsavedChanges(false)
      toast.success(`Set ${targetSet} (${year}) saved!`)
      navigate('/admin/writing')
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

  const noteCount = paragraphs.filter((p) => p.note?.trim()).length

  if (loading)
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#151313] border-t-transparent animate-spin" />
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
            navigate('/admin/writing')
          }}
          onCancel={() => setShowExitDialog(false)}
          title="Unsaved Changes"
          description="You have unsaved changes. If you leave now, your progress will be lost."
          cancelText="Stay"
          confirmText="Leave"
        />

        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              unsavedChanges
                ? setShowExitDialog(true)
                : navigate('/admin/writing')
            }
            className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Button>
          <p className="text-[10px] font-semibold text-[#151313]/40 flex-1 min-w-[200px]">
            Editing Set {editableSetNumber || 'New'} ({year || 'Year'}) •
            Writing Task 1
          </p>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 bg-white border-2 border-[#151313] rounded-xl px-3 py-1.5">
                  <span className="text-xs font-black text-[#151313]/60">
                    Duration:
                  </span>
                  <span className="text-xs font-black text-[#151313]">
                    25 min
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Writing test duration is fixed at 25 minutes</p>
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

        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 pb-12 space-y-6">
          <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Writing Task 1
          </span>

          {/* Context & Email Header */}
          <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
            <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
              <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                Email Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Context */}
              <div className="space-y-1">
                <Label
                  className={`text-xs font-black uppercase tracking-widest ${labelErr('context')}`}
                >
                  Context
                </Label>
                <Textarea
                  value={context}
                  onChange={(e) => {
                    setContext(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n.context
                      return n
                    })
                  }}
                  rows={3}
                  className={`border-2 rounded-xl text-sm ${errKey('context')} focus-visible:border-[#E9424C]`}
                  placeholder="e.g. Your class teacher, Miss Maryam, is organising a school programme... Read the following email from her."
                />
                <ErrMsg k="context" />
              </div>
              <Separator className="bg-[#151313]/10" />
              {/* From */}
              <div className="space-y-1">
                <Label
                  className={`text-xs font-black uppercase tracking-widest ${labelErr('from')}`}
                >
                  From
                </Label>
                <Input
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n.from
                      return n
                    })
                  }}
                  className={`border-2 rounded-xl text-sm ${errKey('from')}`}
                  placeholder="e.g. Miss Maryam <maryam@zmail.com>"
                />
                <ErrMsg k="from" />
              </div>
              {/* Subject */}
              <div className="space-y-1">
                <Label
                  className={`text-xs font-black uppercase tracking-widest ${labelErr('subject')}`}
                >
                  Subject
                </Label>
                <Input
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    setFieldErrors((p) => {
                      const n = { ...p }
                      delete n.subject
                      return n
                    })
                  }}
                  className={`border-2 rounded-xl text-sm ${errKey('subject')}`}
                  placeholder="e.g. Stay Healthy!"
                />
                <ErrMsg k="subject" />
              </div>
            </CardContent>
          </Card>

          {/* Email Paragraphs */}
          <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
            <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                  Email Body
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${noteCount === 4 ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]' : 'bg-[#E9424C]/10 border-[#E9424C] text-[#E9424C]'}`}
                  >
                    {noteCount}/4 notes
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {fieldErrors.notes && (
                <p className="text-[10px] text-[#E9424C] font-medium">
                  {fieldErrors.notes}
                </p>
              )}

              {paragraphs.map((para, idx) => (
                <div
                  key={idx}
                  className="border-2 border-[#151313]/20 rounded-xl p-4 space-y-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-[#151313]/30" />
                      <span className="text-xs font-black text-[#151313]">
                        Paragraph {idx + 1}
                      </span>
                      {para.note?.trim() && (
                        <span className="text-[9px] font-black bg-[#E9424C] text-white px-2 py-0.5 rounded-full">
                          NOTE
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePara(idx)}
                      className="w-7 h-7 p-0 text-[#E9424C] hover:text-[#E9424C]"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  {/* Paragraph text */}
                  <div className="space-y-1">
                    <Label
                      className={`text-[10px] font-black uppercase tracking-widest ${fieldErrors[`para_${idx}_text`] ? 'text-[#E9424C]' : 'text-[#151313]/60'}`}
                    >
                      Text
                    </Label>
                    <Textarea
                      value={para.text}
                      onChange={(e) => updatePara(idx, 'text', e.target.value)}
                      rows={2}
                      className={`border-2 rounded-xl text-sm ${fieldErrors[`para_${idx}_text`] ? 'border-[#E9424C]' : 'border-[#151313]/30'} focus-visible:border-[#151313]`}
                      placeholder="e.g. Hi everyone,"
                    />
                    <ErrMsg k={`para_${idx}_text`} />
                  </div>
                  {/* Note (optional) */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#151313]/60">
                      Note{' '}
                      <span className="text-[#151313]/30 normal-case font-medium">
                        (leave empty if no note for this paragraph)
                      </span>
                    </Label>
                    <Input
                      value={para.note}
                      onChange={(e) => updatePara(idx, 'note', e.target.value)}
                      className={`border-2 rounded-xl text-sm ${para.note?.trim() ? 'border-[#E9424C] bg-[#E9424C]/5' : 'border-[#151313]/30'}`}
                      placeholder="e.g. Wonderful! ..."
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPara}
                className="w-full border-2 border-dashed border-[#151313]/30 rounded-xl text-xs font-black text-[#151313]/50 hover:border-[#151313] hover:text-[#151313]"
              >
                <Plus size={14} className="mr-2" /> Add Paragraph
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
