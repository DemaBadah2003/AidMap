'use client'



import { useState, useEffect, useCallback, useMemo } from 'react'

import { Card, CardContent } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import {

  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,

} from '@/components/ui/dialog'

import {

  Plus, Search, Pencil, Save, X, Package,

  Loader2, ChevronRight, ChevronLeft, ChevronDown, User, Check

} from 'lucide-react'



// الأنواع

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



const statusLabels: Record<DistributionStatus, string> = {

  PENDING: 'مجدول',

  COMPLETED: 'مكتمل',

  CANCELLED: 'ملغي',

}



const BASE_URL = '/api/project/projects/distributions'



export default function DistributionsPage() {

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

      const [resDist, resBen, resProd] = await Promise.all([

        fetch(BASE_URL),

        fetch('/api/project/projects/beneficiaries'),

        fetch('/api/project/projects/products')      

      ])

     

      const dDist = await resDist.json()

      const dBen = await resBen.json()

      const dProd = await resProd.json()



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



  const filtered = useMemo(() => {

    return items.filter(x => {

      const matchesSearch = x.beneficiaryName?.toLowerCase().includes(q.toLowerCase()) ||

                           x.productName?.toLowerCase().includes(q.toLowerCase());

      const matchesStatus = statusFilter === 'all' || x.status === statusFilter;

      return matchesSearch && matchesStatus;

    })

  }, [items, q, statusFilter])



  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {

    const start = (currentPage - 1) * itemsPerPage

    return filtered.slice(start, start + itemsPerPage)

  }, [filtered, currentPage, itemsPerPage])



  const onAdd = async () => {

    if (!newForm.beneficiaryId || !newForm.productId) return alert("يرجى اختيار المستفيد والمنتج")

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

    } catch (err) { alert("خطأ في الحفظ") }

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

        const errData = await res.json();

        alert(errData.message || "خطأ في التعديل");

      }

    } catch (err) { alert("خطأ في الاتصال بالسيرفر") }

    finally { setSubmitting(false) }

  }



  return (

    <div className="w-full min-h-screen px-6 py-8 bg-slate-50 text-right" dir="rtl">

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-slate-800">إدارة التوزيعات</h1>

        <p className="text-xs text-slate-500 mt-1">الرئيسية {'>'} متابعة تسليم المساعدات</p>

      </div>



      <Card className="shadow-sm border-none bg-white">

        <CardContent className="p-0">

          <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b">

            <div className="flex items-center gap-3 flex-1 max-w-2xl">

              <div className="relative w-full max-w-md">

                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                <Input

                  value={q}

                  onChange={e => { setQ(e.target.value); setCurrentPage(1); }}

                  placeholder="بحث عن منتج أو مستفيد..."

                  className="pr-10 bg-slate-50 border-none h-10 font-sans"

                />

              </div>

              <div className="relative min-w-[150px]">

                <select

                  value={statusFilter}

                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}

                  className="w-full h-10 pr-3 pl-10 bg-slate-50 border border-slate-100 rounded-lg text-sm appearance-none cursor-pointer font-sans outline-none"

                >

                  <option value="all">كل الحالات</option>

                  {Object.entries(statusLabels).map(([val, label]) => (

                    <option key={val} value={val}>{label}</option>

                  ))}

                </select>

                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

              </div>

            </div>

            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 font-sans">

              <Plus className="ml-2 h-4 w-4" /> إضافة توزيع جديد

            </Button>

          </div>



          <table className="w-full">

            <thead className="bg-slate-50/50 border-b text-slate-500 font-bold font-sans">

              <tr>

                <th className="p-4 text-sm text-right">المستفيد</th>

                <th className="p-4 text-sm text-right">المنتج</th>

                <th className="p-4 text-sm text-center">الكمية</th>

                <th className="p-4 text-sm text-center">الحالة</th>

                <th className="p-4 text-sm text-center">الإجراءات</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>

              ) : paginatedItems.map((row) => (

                <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">

                  <td className="p-4 text-sm font-sans">

                    <div className="flex items-center gap-2">

                      <User className="h-4 w-4 text-slate-400" />

                      {editingId === row.id ? (

                        <select

                          className="border rounded-md p-1 bg-white text-xs outline-none w-full"

                          value={editDraft.beneficiaryId}

                          onChange={e => setEditDraft({...editDraft, beneficiaryId: e.target.value})}

                        >

                          {beneficiaries.map(b => (

                            <option key={b.id} value={b.id}>{b.name || b.fullName || b.nameAr}</option>

                          ))}

                        </select>

                      ) : (

                        <span className="font-medium text-slate-700">{row.beneficiaryName}</span>

                      )}

                    </div>

                  </td>

                  <td className="p-4 text-sm font-sans">

                    <div className="flex items-center gap-2">

                      <Package className="h-4 w-4 text-slate-400" />

                      {editingId === row.id ? (

                        <select

                          className="border rounded-md p-1 bg-white text-xs outline-none w-full"

                          value={editDraft.productId}

                          onChange={e => setEditDraft({...editDraft, productId: e.target.value})}

                        >

                          {products.map(p => (

                            <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>

                          ))}

                        </select>

                      ) : (

                        <span>{row.productName}</span>

                      )}

                    </div>

                  </td>

                  <td className="p-4 text-center font-bold text-blue-600 font-sans">

                    {editingId === row.id ? (

                      <Input

                        type="number"

                        className="w-20 mx-auto h-8 text-center"

                        value={editDraft.quantity}

                        onChange={e => setEditDraft({...editDraft, quantity: Number(e.target.value)})}

                      />

                    ) : row.quantity}

                  </td>

                  <td className="p-4 text-center">

                    {editingId === row.id ? (

                      <select

                        className="border rounded-md p-1 bg-white text-xs font-sans outline-none"

                        value={editDraft.status}

                        onChange={e => setEditDraft({...editDraft, status: e.target.value as DistributionStatus})}

                      >

                        {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}

                      </select>

                    ) : (

                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold font-sans ${

                        row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :

                        row.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'

                      }`}>

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

                        <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setEditingId(null)}>

                          <X className="h-4 w-4" />

                        </Button>

                      </div>

                    ) : (

                      <Button variant="ghost" size="sm" className="text-blue-500" onClick={() => {

                        setEditingId(row.id);

                        setEditDraft({

                          beneficiaryId: row.beneficiaryId,

                          productId: row.productId,

                          quantity: row.quantity,

                          status: row.status

                        });

                      }}>

                        <Pencil className="h-4 w-4" />

                      </Button>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>



          <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">

            <div className="flex items-center gap-2">

              <span className="text-xs text-slate-500 font-sans">عرض:</span>

              <select

                className="bg-white border rounded p-1 text-xs outline-none cursor-pointer"

                value={itemsPerPage}

                onChange={e => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}

              >

                {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v}</option>)}

              </select>

              <span className="text-xs text-slate-500 font-sans">من أصل {filtered.length}</span>

            </div>

            <div className="flex items-center gap-4">

               <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1} className="h-8 font-sans">

                 السابق <ChevronRight className="h-4 w-4 mr-1" />

              </Button>

              <div className="text-xs font-bold text-slate-600 font-sans">{currentPage} - {totalPages || 1}</div>

              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 font-sans">

                <ChevronLeft className="h-4 w-4 ml-1" /> التالي

              </Button>

            </div>

          </div>

        </CardContent>

      </Card>



      <Dialog open={addOpen} onOpenChange={setAddOpen}>

        <DialogContent dir="rtl" className="sm:max-w-md">

          <DialogHeader><DialogTitle className="text-right font-sans">إضافة توزيع جديد</DialogTitle></DialogHeader>

          <div className="grid gap-4 py-4 text-right font-sans">

            <div>

              <label className="text-xs font-bold block mb-1">المستفيد</label>

              <select

                className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none"

                value={newForm.beneficiaryId}

                onChange={e => setNewForm({...newForm, beneficiaryId: e.target.value})}

              >

                <option value="">-- اختر المستفيد --</option>

                {beneficiaries.map(b => (

                  <option key={b.id} value={b.id}>

                    {b.name || b.fullName || b.nameAr}

                  </option>

                ))}

              </select>

            </div>

            <div>

              <label className="text-xs font-bold block mb-1">المنتج</label>

              <select

                className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none"

                value={newForm.productId}

                onChange={e => setNewForm({...newForm, productId: e.target.value})}

              >

                <option value="">-- اختر المنتج --</option>

                {products.map(p => (

                  <option key={p.id} value={p.id}>

                    {p.nameAr || p.name}

                  </option>

                ))}

              </select>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="text-xs font-bold block mb-1">الكمية</label>

                <Input

                  type="number"

                  value={newForm.quantity}

                  onChange={e => setNewForm({...newForm, quantity: Number(e.target.value)})}

                  className="bg-slate-50"

                />

              </div>

              <div>

                <label className="text-xs font-bold block mb-1">الحالة</label>

                <select

                  className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none"

                  value={newForm.status}

                  onChange={e => setNewForm({...newForm, status: e.target.value as DistributionStatus})}

                >

                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}

                </select>

              </div>

            </div>

          </div>

          <DialogFooter className="flex flex-row-reverse items-center justify-between w-full gap-2 mt-4 font-sans">

            <Button onClick={onAdd} disabled={submitting} className="bg-blue-600 text-white flex-1 h-11 shadow-lg shadow-blue-100">

              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'حفظ البيانات'}

            </Button>

            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200">إلغاء</Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  )

}