import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import api from '../../../services/api'
import { PracticeSetSkeleton } from '../../../components/layouts/Skeletons'
import { Button } from '@/components/ui/button'

function BookletList({ setNumber, navigate }) {
  const [booklets, setBooklets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/speaking/sets/${setNumber}`)
      .then((res) => setBooklets(res.data.booklets))
      .catch(() => setError('Failed to load booklets.'))
      .finally(() => setLoading(false))
  }, [setNumber])

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/speaking')}
          className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </Button>
        <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
          Speaking • Practice Set {setNumber}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-lg font-black text-[#151313] mb-1">
          Choose a Booklet
        </h1>
        <p className="text-xs text-[#151313]/40 font-medium mb-6">
          Select a topic to practise
        </p>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <PracticeSetSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm font-semibold text-[#E9424C]">{error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {booklets.map((booklet) => (
              <Button
                key={booklet.part_number}
                variant="outline"
                onClick={() =>
                  navigate(`/speaking/${setNumber}/${booklet.part_number}`)
                }
                className="w-full h-auto justify-start bg-white rounded-2xl border-2 border-[#151313] p-4 shadow-[3px_3px_0px_#151313] hover:shadow-[5px_5px_0px_#151313] hover:-translate-y-0.5 transition-all text-left"
              >
                <p className="text-sm font-black text-[#151313] leading-snug">
                  {booklet.passage_title}
                </p>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CandidateList({ setNumber, partNumber, navigate }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/speaking/sets/${setNumber}/${partNumber}`)
      .then((res) => setCandidates(res.data.candidates))
      .catch(() => setError('Failed to load candidates.'))
      .finally(() => setLoading(false))
  }, [setNumber, partNumber])

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/speaking/${setNumber}`)}
          className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </Button>
        <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
          Speaking • Set {setNumber} • Booklet {partNumber}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-lg font-black text-[#151313] mb-1">
          Choose Your Candidate
        </h1>
        <p className="text-xs text-[#151313]/40 font-medium mb-6">
          Each candidate speaks on a different subtopic
        </p>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <PracticeSetSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm font-semibold text-[#E9424C]">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {candidates.map((c) => (
              <Button
                key={c.question_number}
                variant="outline"
                onClick={() =>
                  navigate(
                    `/speaking/${setNumber}/${partNumber}/${c.question_number}`
                  )
                }
                className="w-full h-auto justify-start bg-white rounded-2xl border-2 border-[#151313] p-4 shadow-[3px_3px_0px_#151313] hover:shadow-[5px_5px_0px_#151313] hover:-translate-y-0.5 transition-all text-left flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-[#151313] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-white">
                    {String.fromCharCode(64 + c.question_number)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#151313] leading-snug whitespace-normal break-words flex-1">
                  {c.question_text}
                </p>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SpeakingBooklets() {
  const { setNumber, partNumber } = useParams()
  const navigate = useNavigate()

  if (partNumber) {
    return (
      <CandidateList
        setNumber={setNumber}
        partNumber={partNumber}
        navigate={navigate}
      />
    )
  }
  return <BookletList setNumber={setNumber} navigate={navigate} />
}
