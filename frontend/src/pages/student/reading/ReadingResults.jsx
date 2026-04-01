import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../../services/api'
import { ResultsPage } from '../../../components/layouts/ResultCard'

export default function ReadingResults() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [questions, setQuestions] = useState([])

  const results =
    location.state ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem(`reading_results_${setNumber}`))
      } catch {
        return null
      }
    })()

  useEffect(() => {
    if (!results) {
      navigate(`/reading/${setNumber}`, { replace: true })
      return
    }
    api
      .get(`/reading/sets/${setNumber}`)
      .then((res) => setQuestions(res.data.questions))
      .catch(() => {})
  }, [])

  if (!results) return null

  const enriched = results.results.map((r) => {
    const q = questions.find((q) => q.id === r.question_id) || {}
    return {
      ...r,
      question_text: q.question_text,
      options: q.options,
      part_number: q.part_number,
    }
  })

  const byPart = enriched.reduce((acc, r) => {
    const part = r.part_number
    if (!acc[part]) acc[part] = []
    acc[part].push(r)
    return acc
  }, {})

  return (
    <ResultsPage
      backPath="/reading"
      heroImage="/src/assets/7.svg"
      results={results}
      byPart={byPart}
    />
  )
}