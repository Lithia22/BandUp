import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Headphones, Plus, Edit, Trash2 } from 'lucide-react'
import SidebarLayout from '../../../../components/layouts/SidebarLayout'
import { ExitWarningDialog } from '../../../../components/layouts/Dialog'
import api from '../../../../services/api'
import { toast } from 'sonner'
import { PracticeSetSkeleton } from '../../../../components/layouts/Skeletons'

const getDrafts = () => {
  const drafts = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('listening_admin_draft_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (data?.allQuestions?.length > 0) {
          drafts.push({
            id: key.replace('listening_admin_draft_', ''),
            ...data,
          })
        }
      } catch {}
    }
  }
  return drafts
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`
  return date.toLocaleDateString()
}

export default function AdminListening() {
  const navigate = useNavigate()
  const [publishedSets, setPublishedSets] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: null,
    id: null,
    label: '',
  })

  useEffect(() => {
    loadPublishedSets()
    setDrafts(getDrafts())
  }, [])

  const loadPublishedSets = async () => {
    try {
      const res = await api.get('/listening/sets')
      setPublishedSets(res.data.sets || [])
    } catch {
      toast.error('Failed to load practice sets')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSet = async () => {
    try {
      await api.delete(
        `/admin/questions?component=listening&set_number=${deleteDialog.id}`
      )
      toast.success(`Set ${deleteDialog.id} deleted`)
      loadPublishedSets()
    } catch {
      toast.error('Failed to delete set')
    } finally {
      setDeleteDialog({ open: false, type: null, id: null, label: '' })
    }
  }

  const handleDeleteDraft = () => {
    localStorage.removeItem(`listening_admin_draft_${deleteDialog.id}`)
    setDrafts(getDrafts())
    toast.success('Draft deleted')
    setDeleteDialog({ open: false, type: null, id: null, label: '' })
  }

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="text-lg font-black text-[#151313]">
                  Edit Listening
                </h1>
              </div>
            </div>

            <Card
              className="relative border-2 border-[#151313] rounded-2xl overflow-hidden mb-6 shadow-[4px_4px_0px_#151313]"
              style={{ background: '#1A1A1A', minHeight: 160 }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#E9424C] uppercase tracking-widest mb-1">
                      Listening
                    </p>
                    <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-1.5">
                      Practice Sets
                    </h2>
                    <p className="text-white/50 text-xs font-medium">
                      Create, edit and manage listening practice sets
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/admin/listening/editor')}
                    className="bg-[#E9424C] text-white border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#c73540] flex items-center gap-2"
                  >
                    <Plus size={14} /> New Set
                  </Button>
                </div>
              </CardContent>
            </Card>

            {drafts.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                  Drafts ({drafts.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drafts.map((draft) => (
                    <Card
                      key={draft.id}
                      className="group cursor-pointer border-2 border-[#151313] rounded-2xl shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200"
                      onClick={() =>
                        navigate(`/admin/listening/editor?draft=${draft.id}`)
                      }
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
                              <Headphones size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-base font-black text-[#151313]">
                                {draft.editableSetNumber
                                  ? `Set ${draft.editableSetNumber}`
                                  : 'Draft Set'}
                              </p>
                              <p className="text-[10px] font-semibold text-[#151313]/40">
                                {draft.year || '—'} •{' '}
                                {draft.allQuestions?.length || 0} questions
                                added
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-[#E9424C] text-white border-2 border-[#151313] text-[9px]">
                            Draft
                          </Badge>
                        </div>
                        <p className="text-[10px] font-medium text-[#151313]/40 mb-4">
                          Last edited: {formatTimestamp(draft.timestamp)}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#151313]/10">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-2 border-[#151313] rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(
                                  `/admin/listening/editor?draft=${draft.id}`
                                )
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-2 border-[#E9424C] text-[#E9424C] hover:bg-[#E9424C] hover:text-white rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteDialog({
                                  open: true,
                                  type: 'draft',
                                  id: draft.id,
                                  label: 'this draft',
                                })
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                Published Sets ({publishedSets.length})
              </p>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <PracticeSetSkeleton key={i} />
                  ))}
                </div>
              ) : publishedSets.length === 0 ? (
                <Card className="border-2 border-[#151313] rounded-2xl bg-white/50">
                  <CardContent className="p-8 text-center">
                    <Headphones
                      size={40}
                      className="mx-auto mb-3 text-[#151313]/20"
                    />
                    <p className="text-sm font-medium text-[#151313]/40 mb-4">
                      No practice sets yet
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/listening/editor')}
                      className="border-2 border-[#151313] rounded-xl text-xs font-black"
                    >
                      <Plus size={14} className="mr-2" /> Create your first set
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publishedSets.map((set) => (
                    <Card
                      key={set.set_number}
                      className="group cursor-pointer border-2 border-[#151313] rounded-2xl shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200"
                      onClick={() =>
                        navigate(`/admin/listening/editor/${set.set_number}`)
                      }
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
                              <Headphones size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-base font-black text-[#151313]">
                                Set {set.set_number}
                              </p>
                              <p className="text-[10px] font-semibold text-[#151313]/40">
                                {set.year} • {set.total_questions || 30}{' '}
                                questions
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-[#22c55e] text-white border-2 border-[#151313] text-[9px]">
                            Published
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#151313]/10">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-2 border-[#151313] rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(
                                  `/admin/listening/editor/${set.set_number}`
                                )
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-2 border-[#E9424C] text-[#E9424C] hover:bg-[#E9424C] hover:text-white rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteDialog({
                                  open: true,
                                  type: 'set',
                                  id: set.set_number,
                                  label: `Set ${set.set_number}`,
                                })
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <ExitWarningDialog
              open={deleteDialog.open}
              onOpenChange={(open) =>
                !open &&
                setDeleteDialog({
                  open: false,
                  type: null,
                  id: null,
                  label: '',
                })
              }
              onConfirm={
                deleteDialog.type === 'set'
                  ? handleDeleteSet
                  : handleDeleteDraft
              }
              onCancel={() =>
                setDeleteDialog({
                  open: false,
                  type: null,
                  id: null,
                  label: '',
                })
              }
              title={`Delete ${deleteDialog.label}?`}
              description="This cannot be undone."
              cancelText="Cancel"
              confirmText="Delete"
              confirmBgColor="bg-[#E9424C]"
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
