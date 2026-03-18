import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function QuestionCard({
  q,
  idx,
  total,
  selectedPart,
  fieldErrors,
  updateOption,
  updateCorrectAnswer,
  removeQuestion,
  moveQuestion,
  errKey,
  labelErr,
  ErrMsg,
}) {
  if (selectedPart === 5) {
    return (
      <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
        <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveQuestion(idx, -1)}
                  disabled={idx === 0}
                  className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
                >
                  <ArrowUp size={10} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveQuestion(idx, 1)}
                  disabled={idx === total - 1}
                  className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
                >
                  <ArrowDown size={10} />
                </Button>
              </div>
              <CardTitle className="text-sm font-black text-[#151313]">
                <span className="text-[#E9424C] mr-2">
                  {q.question_number}.
                </span>
                Gap {q.question_number - 20}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(q.question_number)}
              className="text-[#E9424C] hover:text-[#E9424C]"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-2">
            <Label className="text-xs font-black text-[#151313] uppercase tracking-widest">
              Correct Answer
            </Label>
            <div className="flex gap-2 flex-wrap">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((key) => {
                const isCorrect = q.correct_answer === key
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCorrectAnswer(q.question_number, key)}
                    className={`w-9 h-9 p-0 rounded-full border-2 text-xs font-black ${
                      isCorrect
                        ? 'bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#22c55e] hover:text-white'
                        : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'
                    }`}
                  >
                    {isCorrect ? <Check size={12} /> : key}
                  </Button>
                )
              })}
            </div>
            <ErrMsg k={`q${q.question_number}_correct`} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-[#151313] rounded-2xl shadow-[3px_3px_0px_#151313] overflow-hidden">
      <CardHeader className="border-b-2 border-[#151313] bg-white py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveQuestion(idx, -1)}
                disabled={idx === 0}
                className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
              >
                <ArrowUp size={10} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveQuestion(idx, 1)}
                disabled={idx === total - 1}
                className="w-6 h-5 p-0 text-[#151313]/30 hover:text-[#151313] disabled:opacity-20"
              >
                <ArrowDown size={10} />
              </Button>
            </div>
            <CardTitle className="text-sm font-black text-[#151313]">
              <span className="text-[#E9424C] mr-2">{q.question_number}.</span>
              Question
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeQuestion(q.question_number)}
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
              updateOption(q.question_number, 'question_text', e.target.value)
            }
            className={`border-2 rounded-xl text-sm ${errKey(`q${q.question_number}_text`)}`}
            placeholder="Enter question text..."
          />
          <ErrMsg k={`q${q.question_number}_text`} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black text-[#151313] uppercase tracking-widest">
            Options
          </Label>
          {Object.entries(q.options).map(([key, value]) => {
            const isCorrect = q.correct_answer === key
            const hk = `q${q.question_number}_opt_${key}`
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCorrectAnswer(q.question_number, key)}
                    className={`w-8 h-8 p-0 rounded-full border-2 shrink-0 ${
                      isCorrect
                        ? 'bg-[#22c55e] border-[#22c55e] text-white hover:bg-[#22c55e] hover:text-white'
                        : 'border-[#151313] text-[#151313] hover:bg-[#151313] hover:text-white'
                    }`}
                  >
                    {isCorrect ? <Check size={14} /> : key}
                  </Button>
                  <Input
                    value={value}
                    onChange={(e) =>
                      updateOption(q.question_number, key, e.target.value)
                    }
                    className={`flex-1 border-2 rounded-xl text-sm ${
                      fieldErrors[hk]
                        ? 'border-[#E9424C]'
                        : isCorrect
                          ? 'border-[#22c55e] bg-[#22c55e]/5'
                          : 'border-[#151313]'
                    }`}
                    placeholder={`Option ${key}`}
                  />
                </div>
                <ErrMsg k={hk} />
              </div>
            )
          })}
          <ErrMsg k={`q${q.question_number}_correct`} />
        </div>
      </CardContent>
    </Card>
  )
}
