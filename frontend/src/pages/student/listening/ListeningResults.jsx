import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../../services/api'
import { ResultsPage } from '../../../components/layouts/ResultCard'

function getPartForQuestion(qNum) {
  if (qNum <= 7) return 1
  if (qNum <= 14) return 2
  if (qNum <= 17) return 3
  if (qNum <= 24) return 4
  return 5
}

export default function ListeningResults() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [questions, setQuestions] = useState([])

  const results =
    location.state ||
    (() => {
      try {
        return JSON.parse(
          localStorage.getItem(`listening_results_${setNumber}`)
        )
      } catch {
        return null
      }
    })()

  useEffect(() => {
    if (!results) {
      navigate(`/listening/${setNumber}`, { replace: true })
      return
    }
    api
      .get(`/listening/sets/${setNumber}`)
      .then((res) => setQuestions(res.data.questions))
      .catch(() => {})
  }, [])

  if (!results) return null

  const enriched = results.results.map((r) => {
    const q = questions.find((q) => q.id === r.question_id) || {}
    return { ...r, question_text: q.question_text, options: q.options }
  })

  const byPart = enriched.reduce((acc, r) => {
    const part = r.part_number || getPartForQuestion(r.question_number)
    if (!acc[part]) acc[part] = []
    acc[part].push(r)
    return acc
  }, {})

  return (
    <ResultsPage
      backPath="/listening"
      heroImage="/src/assets/7.svg"
      results={results}
      byPart={byPart}
    />
  )
}
