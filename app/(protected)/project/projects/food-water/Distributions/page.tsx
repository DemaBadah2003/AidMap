'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus, Search, Pencil, Save, X, Package, Loader2, ChevronDown, User,
} from 'lucide-react'

type DistributionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

interface DistributionItem {
  id: string
  quantity: number
  status: DistributionStatus
  institutionName: string
  productName: string
  beneficiaryName: string
  beneficiaryId: string
  productId: string
}

const BASE_URL = '/api/project/projects/distributions'

const selectClass = 'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

export default function DistributionsPage() {
  const { t } = useTranslation()

  const statusLabels = useMemo((): Record<DistributionStatus, string> => ({
    PENDING: t('common.labels.status'),
    COMPLETED: t('common.labels.active'),
    CANCELLED: t('common.labels.inactive'),
  }), [t])

  const [items, setItems] = useState<DistributionItem[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [addOpen, setAddOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    beneficiaryId: '',
    productId: '',
    quantity: 1,
    status: 'PENDING' as DistributionStatus
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dDist, dBen, dProd] = await Promise.all([
        fetch(BASE_URL).then(r => r.json()).catch(() => []),
        fetch('/api/project/projects/beneficiaries').then(r => r.json()).catch(() => []),
        fetch('/api/project/projects/products').then(r => r.json()).catch(() => []),
      ])
      setItems(Array.isArray(dDist) ? dDist : [])
      setBeneficiaries(Array.isArray(dBen) ? dBen : [])
      setProducts(Array.isArray(dProd) ? dProd : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() =>
    items.filter(x => {
      const matchesSearch = x.beneficiaryName?.toLowerCase().includes(q.toLowerCase()) ||
        x.productName?.toLowerCase().includes(q.toLowerCase())
      const matchesStatus = statusFilter === 'all' || x.status === statusFilter
      return matchesSearch && matchesStatus
    }),
    [items, q, statusFilter]
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  const onAdd = async () => {
    if (!newForm.beneficiaryId || !newForm.productId) return alert(t('common.messages.required'))
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        setNewForm({ beneficiaryId: '', productId: '', quantity: 1, status: 'PENDING' })
      }
    } catch { alert(t('common.messages.saveError')) }
    finally { setSubmitting(false) }
  }

  const onSaveEdit = async (id: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editDraft.quantity,
          status: editDraft.status,
          beneficiaryId: editDraft.beneficiaryId,
          productId: editDraft.productId
        })
      })
      if (res.ok) {
        await fetchData()
        setEditingId(null)
      } else {
        const errData = await res.json()
        alert(errData.message || t('common.messages.saveError'))
      }
    } catch { alert(t('common.messages.error')) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="mb-6 text-start">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.distributions.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('pages.distributions.title')}</p>
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative w-full max-w-md">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={e => { setQ(e.target.value); setCurrentPage(1) }}
                  placeholder={t('common.messages.searchPlaceholder')}
                  className="pe-10 h-10"
                />
              </div>
              <div className="relative min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                  className={`${selectClass} h-10 appearance-none cursor-pointer`}
                >
                  <option value="all">{t('common.labels.all')}</option>
                  {(Object.keys(statusLabels) as DistributionStatus[]).map((val) => (
                    <option key={val} value={val}>{statusLabels[val]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 gap-2">
              <Plus className="h-4 w-4" /> {t('pages.distributions.addButton')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm border-collapse">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.distributions.beneficiary')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.distributions.product')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('pages.distributions.quantity')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.status')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="p-16 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto mb-2 size-5" />{t('common.messages.loading')}
                  </td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={5} className="p-16 text-center text-muted-foreground italic">{t('common.messages.noData')}</td></tr>
                ) : paginatedItems.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {editingId === row.id ? (
                          <select className={`${selectClass} p-1 text-xs`} value={editDraft.beneficiaryId} onChange={e => setEditDraft({ ...editDraft, beneficiaryId: e.target.value })}>
                            {beneficiaries.map(b => (
                              <option key={b.id} value={b.id}>{b.name || b.fullName || b.nameAr}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-medium text-foreground">{row.beneficiaryName}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {editingId === row.id ? (
                          <select className={`${selectClass} p-1 text-xs`} value={editDraft.productId} onChange={e => setEditDraft({ ...editDraft, productId: e.target.value })}>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-foreground">{row.productName}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-blue-600">
                      {editingId === row.id ? (
                        <Input type="number" className="w-20 mx-auto h-8 text-center" value={editDraft.quantity} onChange={e => setEditDraft({ ...editDraft, quantity: Number(e.target.value) })} />
                      ) : row.quantity}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === row.id ? (
                        <select className={`${selectClass} p-1 text-xs`} value={editDraft.status} onChange={e => setEditDraft({ ...editDraft, status: e.target.value as DistributionStatus })}>
                          {(Object.keys(statusLabels) as DistributionStatus[]).map(v => <option key={v} value={v}>{statusLabels[v]}</option>)}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : row.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {statusLabels[row.status]}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === row.id ? (
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => onSaveEdit(row.id)} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            setEditingId(row.id)
                            setEditDraft({ beneficiaryId: row.beneficiaryId, productId: row.productId, quantity: row.quantity, status: row.status })
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('common.labels.total')}:</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span>/ {filtered.length}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{rangeStart} – {rangeEnd}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>{t('common.buttons.prev')}</Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>{t('common.buttons.next')}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start font-bold">{t('pages.distributions.addTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-start">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t('pages.distributions.beneficiary')}</label>
              <select className={`${selectClass} p-2.5`} value={newForm.beneficiaryId} onChange={e => setNewForm({ ...newForm, beneficiaryId: e.target.value })}>
                <option value="">-- {t('pages.distributions.beneficiary')} --</option>
                {beneficiaries.map(b => (
                  <option key={b.id} value={b.id}>{b.name || b.fullName || b.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t('pages.distributions.product')}</label>
              <select className={`${selectClass} p-2.5`} value={newForm.productId} onChange={e => setNewForm({ ...newForm, productId: e.target.value })}>
                <option value="">-- {t('pages.distributions.product')} --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t('pages.distributions.quantity')}</label>
                <Input type="number" value={newForm.quantity} onChange={e => setNewForm({ ...newForm, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t('common.labels.status')}</label>
                <select className={`${selectClass} p-2.5`} value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as DistributionStatus })}>
                  {(Object.keys(statusLabels) as DistributionStatus[]).map(v => <option key={v} value={v}>{statusLabels[v]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 mt-2">
            <Button onClick={onAdd} disabled={submitting} className="bg-blue-600 text-white flex-1 h-11 gap-2">
              {submitting && <Loader2 className="animate-spin h-4 w-4" />}
              {t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
