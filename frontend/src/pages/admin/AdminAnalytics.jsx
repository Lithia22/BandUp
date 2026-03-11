import { useEffect, useState, useMemo } from 'react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  CLUSTER_CONFIG,
  ClusterCardsSection,
  ClusterBreakdownChart,
  ClusterDistributionChart,
  ClusterMapChart,
  StudentRecordsSection,
} from '../../components/layouts/AdminCharts'
import SidebarLayout from '../../components/layouts/SidebarLayout'
import api from '../../services/api'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .get('/admin/clusters')
      .then((res) => {
        const normalized = {
          ...res.data,
          students: (res.data?.students || []).map((s) => ({
            ...s,
            cluster_label:
              typeof s.cluster_label === 'string'
                ? s.cluster_label.replace(/^"|"$/g, '').trim()
                : s.cluster_label,
          })),
        }
        setData(normalized)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const labels = Object.keys(CLUSTER_CONFIG)

  const clusterBarData = labels.map((label) => ({
    name: label
      .replace(' Skills', '')
      .replace(' Performer', '')
      .replace(' Needed', ''),
    fullName: label,
    count: data?.summary?.[label] || 0,
    color: CLUSTER_CONFIG[label].color,
  }))

  const pieData = labels
    .map((label) => ({
      name: label,
      value: data?.summary?.[label] || 0,
      color: CLUSTER_CONFIG[label].color,
    }))
    .filter((d) => d.value > 0)

  const scatterByCluster = useMemo(() => {
    const all = data?.students || []
    const map = {}
    labels.forEach((label) => {
      map[label] = []
    })
    all.forEach((s) => {
      const x = parseFloat(
        (((s.listening_band || 0) + (s.reading_band || 0)) / 2).toFixed(2)
      )
      const y = parseFloat(
        (((s.writing_band || 0) + (s.speaking_band || 0)) / 2).toFixed(2)
      )
      if (map[s.cluster_label]) {
        map[s.cluster_label].push({
          x,
          y,
          name: s.full_name || 'Unknown',
          cluster: s.cluster_label,
        })
      }
    })
    return map
  }, [data])

  const centroids = useMemo(() => {
    const result = {}
    labels.forEach((label) => {
      const pts = scatterByCluster[label] || []
      if (!pts.length) return
      const cx = parseFloat(
        (pts.reduce((s, p) => s + p.x, 0) / pts.length).toFixed(2)
      )
      const cy = parseFloat(
        (pts.reduce((s, p) => s + p.y, 0) / pts.length).toFixed(2)
      )
      result[label] = [{ x: cx, y: cy, name: 'Centroid', cluster: label }]
    })
    return result
  }, [scatterByCluster])

  const studentsByTab = useMemo(() => {
    const all = data?.students || []
    const map = { All: all }
    labels.forEach((label) => {
      map[label] = all.filter((s) => s.cluster_label === label)
    })
    return map
  }, [data])

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#151313]">
                Student Analysis
              </h1>
              <p className="text-xs text-[#151313]/40 font-medium mt-0.5">
                {data?.total_students || 0} students grouped by performance
                patterns across all 4 MUET components
              </p>
            </div>

            <ClusterCardsSection data={data} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClusterBreakdownChart clusterBarData={clusterBarData} />
              <ClusterDistributionChart pieData={pieData} />
            </div>

            <ClusterMapChart
              scatterByCluster={scatterByCluster}
              centroids={centroids}
              labels={labels}
            />

            <StudentRecordsSection
              data={data}
              loading={loading}
              search={search}
              setSearch={setSearch}
              studentsByTab={studentsByTab}
            />

            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
