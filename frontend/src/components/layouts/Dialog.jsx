import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

export function ExitWarningDialog({ open, onOpenChange, onConfirm, onCancel }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#f7f7f5] border-2 border-[#151313] rounded-2xl shadow-[8px_8px_0px_#151313] p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-[#151313]">
            Leave this page?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#151313]/70 font-medium">
            You haven't finished your quiz yet. Press Stay to continue, or Leave
            if you're sure.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-white text-[#151313] border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:!bg-[#E9424C] hover:!text-white transition-all"
          >
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#151313] text-white border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#333] transition-all"
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  unansweredCount,
  totalCount,
  submitting,
  isWriting = false,
  wordCount = 0,
  minWords = 100,
}) {
  const belowMinimum = isWriting && wordCount < minWords

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#f7f7f5] border-2 border-[#151313] rounded-2xl shadow-[8px_8px_0px_#151313] p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-[#151313]">
            Submit your answer?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#151313]/70 font-medium">
            {isWriting ? (
              belowMinimum ? (
                <>
                  Your response is only{' '}
                  <span className="text-[#E9424C] font-black">
                    {wordCount} words
                  </span>
                  . You need at least{' '}
                  <span className="text-[#E9424C] font-black">
                    {minWords} words
                  </span>
                  . Once submitted, you cannot change your answer.
                </>
              ) : (
                `Your response is ${wordCount} words. Once submitted, you cannot change your answer.`
              )
            ) : unansweredCount > 0 ? (
              <>
                You still have{' '}
                <span className="text-[#E9424C] font-black">
                  {unansweredCount}
                </span>{' '}
                unanswered question{unansweredCount > 1 ? 's' : ''}. Once
                submitted, you cannot change your answers.
              </>
            ) : (
              `You have answered all ${totalCount} questions. Once submitted, you cannot change your answers.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="bg-white text-[#151313] border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:!bg-[#E9424C] hover:!text-white transition-all"
          >
            Go back
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className="bg-[#E9424C] text-white border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#c73540] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Submitting...' : 'Yes, submit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteDialog({ open, label, onConfirm, onCancel }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-[#f7f7f5] border-2 border-[#151313] rounded-2xl shadow-[8px_8px_0px_#151313] p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313] shrink-0">
              <Trash2 size={15} className="text-white" />
            </div>
            <AlertDialogTitle className="text-base font-black text-[#151313]">
              Delete {label}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs font-medium text-[#151313]/50">
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            className="flex-1 text-xs font-black text-[#151313] border-2 border-[#151313]/20 rounded-xl px-4 py-2.5 hover:border-[#151313] transition-all"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-[#E9424C] text-white text-xs font-black border-2 border-[#151313] rounded-xl px-4 py-2.5 shadow-[2px_2px_0px_#151313] hover:bg-[#c73038] transition-all"
          >
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
