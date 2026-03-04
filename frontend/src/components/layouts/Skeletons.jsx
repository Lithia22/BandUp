import { Skeleton } from '@/components/ui/skeleton'

export function PracticeSetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#151313] p-5 shadow-[4px_4px_0px_#151313]">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl bg-[#151313]/10" />
      </div>

      <Skeleton className="h-5 w-32 mb-1 bg-[#151313]/10" />

      <div className="flex items-center gap-3 mt-2 mb-4">
        <Skeleton className="h-3 w-16 bg-[#151313]/10" />
        <Skeleton className="h-3 w-20 bg-[#151313]/10" />
      </div>

      <Skeleton className="h-8 w-full rounded-xl bg-[#151313]/10 mt-2" />
    </div>
  )
}

export function QuestionCardSkeleton() {
  return (
    <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-4 w-6 bg-[#151313]/10" />
        <Skeleton className="h-4 w-3/4 bg-[#151313]/10" />
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-12 w-full rounded-xl bg-[#151313]/10"
          />
        ))}
      </div>
    </div>
  )
}

export function GappedTextSkeleton() {
  return (
    <div className="mb-2 space-y-4">
      <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]">
        <Skeleton className="h-4 w-64 mb-4 bg-[#151313]/10" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-4 bg-[#151313]/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-[#151313]/10" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-lg bg-[#151313]/10" />
                  <Skeleton className="h-6 w-16 rounded-lg bg-[#151313]/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]">
        <Skeleton className="h-4 w-48 mb-4 bg-[#151313]/10" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-4 bg-[#151313]/10" />
              <Skeleton className="h-4 w-5/6 bg-[#151313]/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResultsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      ]{' '}
      <div className="bg-white border-2 border-[#151313] rounded-2xl p-6 shadow-[4px_4px_0px_#151313] mb-6">
        <Skeleton className="h-6 w-32 mb-4 bg-[#151313]/10" />
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-24 mb-2 bg-[#151313]/10" />
            <Skeleton className="h-4 w-32 bg-[#151313]/10" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full bg-[#151313]/10" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]"
          >
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-4 w-8 bg-[#151313]/10" />
              <Skeleton className="h-4 w-3/4 bg-[#151313]/10" />
            </div>
            <Skeleton className="h-4 w-24 mb-2 bg-[#151313]/10" />
            <Skeleton className="h-10 w-full rounded-xl bg-[#151313]/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function QuizPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full border-2 border-[#151313] bg-[#151313]/10" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-1 bg-[#151313]/10" />
            <Skeleton className="h-3 w-24 bg-[#151313]/10" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl bg-[#151313]/10" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-4">
              <Skeleton className="h-5 w-16 rounded-full mb-2 bg-[#151313]/10" />
              <Skeleton className="h-4 w-64 bg-[#151313]/10" />
            </div>
            <QuestionCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SubmissionSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-3 bg-[#151313]/10" />
          <Skeleton className="h-4 w-64 mx-auto bg-[#151313]/10" />
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-3 w-16 bg-[#151313]/10" />
            <Skeleton className="h-3 w-12 bg-[#151313]/10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-[#151313]/10" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-[#151313] rounded-2xl p-5 shadow-[3px_3px_0px_#151313]"
            >
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-4 w-6 bg-[#151313]/10" />
                <Skeleton className="h-4 w-3/4 bg-[#151313]/10" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton
                    key={j}
                    className="h-10 w-full rounded-xl bg-[#151313]/10"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1 mt-8">
          <div className="w-2 h-2 bg-[#E9424C] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-[#E9424C] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-[#E9424C] rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
