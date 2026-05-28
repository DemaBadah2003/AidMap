'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Loader2, Plus, Edit2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Hospital   = { id: string; hospitalName: string; hospitalType: string; region: string; phone: string }
type Department = { id: string; name: string; deptType: string; status: string; description: string | null }
type Service    = { id: string; name: string; price: number; isAvailable: boolean; departmentId: string; departmentName: string }
type Doctor     = { id: string; name: string; specialty: string; phone: string; workSchedule: string; departmentId: string | null }

export default function HospitalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading]       = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [tab, setTab]               = useState<'departments' | 'services' | 'doctors'>('departments')

    const [hospital, setHospital]       = useState<Hospital | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [doctors, setDoctors]         = useState<Doctor[]>([])
    const [services, setServices]       = useState<Service[]>([])

    // ─── Departments ──────────────────────────────────────────────────────────
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newDept, setNewDept]           = useState({ name: '', deptType: '', status: 'يعمل بكفاءة', description: '' })
    const [updatingId, setUpdatingId]     = useState<string | null>(null)
    const [editRowData, setEditRowData]   = useState<{ name: string; deptType: string; status: string } | null>(null)

    // ─── Services ─────────────────────────────────────────────────────────────
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
    const [newService, setNewService]                   = useState({ name: '', price: '', departmentId: '', isAvailable: true })
    const [editingServiceId, setEditingServiceId]       = useState<string | null>(null)
    const [editServiceData, setEditServiceData]         = useState<{ name: string; price: string; departmentId: string; isAvailable: boolean } | null>(null)

    // ─── Doctors ──────────────────────────────────────────────────────────────
    const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false)
    const [newDoctor, setNewDoctor]                   = useState({ name: '', specialty: '', phone: '', workSchedule: '', departmentId: '' })

    const deptTypesList = [
        "الجراحة العامة", "طب الأطفال", "الاستقبال والطوارئ",
        "الأمراض الباطنية", "النساء والتوليد", "العناية المكثفة",
        "القلب والأوعية الدموية", "العظام والمفاصل", "العيون", "الأنف والأذن والحنجرة"
    ]

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchAllData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const [hospRes, deptsRes, servicesRes, doctorsRes] = await Promise.all([
                fetch(`/api/project/Medical-Services/hospitals/${id}`),
                fetch(`/api/project/Medical-Services/hospitals/${id}/departments`),
                fetch(`/api/project/Medical-Services/hospitals/${id}/service`),
                fetch(`/api/project/Medical-Services/hospitals/${id}/doctors`),
            ])
            if (hospRes.ok)     setHospital(await hospRes.json())
            if (deptsRes.ok)    setDepartments(await deptsRes.json() || [])
            if (servicesRes.ok) setServices(await servicesRes.json() || [])
            if (doctorsRes.ok)  setDoctors(await doctorsRes.json() || [])
        } catch (e) {
            console.error('fetch error:', e)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => { if (id) fetchAllData() }, [id, fetchAllData])

    // ─── Add Department ───────────────────────────────────────────────────────
    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDept.name.trim() || !newDept.deptType.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/departments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDept),
            })
            if (res.ok) {
                const created = await res.json()
                setDepartments(prev => [created, ...prev])
                setNewDept({ name: '', deptType: '', status: 'يعمل بكفاءة', description: '' })
                setIsDialogOpen(false)
            }
        } catch (e) { console.error(e) }
        finally { setSubmitting(false) }
    }

    // ─── Inline Edit Department ───────────────────────────────────────────────
    const startInlineEdit   = (dept: Department) => { setUpdatingId(dept.id); setEditRowData({ name: dept.name, deptType: dept.deptType, status: dept.status }) }
    const cancelInlineEdit  = () => { setUpdatingId(null); setEditRowData(null) }

    const handleSaveInlineEdit = async (deptId: string) => {
        if (!editRowData || !editRowData.name.trim()) return
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/departments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deptId, ...editRowData }),
            })
            if (res.ok) {
                setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...editRowData } : d))
                cancelInlineEdit()
            }
        } catch (e) { console.error(e) }
    }

    // ─── Add Service ──────────────────────────────────────────────────────────
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newService.name.trim() || !newService.price || !newService.departmentId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newService, price: Number(newService.price) }),
            })
            if (res.ok) {
                const created = await res.json()
                setServices(prev => [created, ...prev])
                setNewService({ name: '', price: '', departmentId: '', isAvailable: true })
                setIsServiceDialogOpen(false)
            }
        } catch (e) { console.error(e) }
        finally { setSubmitting(false) }
    }

    // ─── Inline Edit Service ──────────────────────────────────────────────────
    const startEditService  = (srv: Service) => { setEditingServiceId(srv.id); setEditServiceData({ name: srv.name, price: String(srv.price), departmentId: srv.departmentId, isAvailable: srv.isAvailable }) }
    const cancelEditService = () => { setEditingServiceId(null); setEditServiceData(null) }

    const handleSaveServiceEdit = async (srvId: string) => {
        if (!editServiceData || !editServiceData.name.trim()) return
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/service`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: srvId, name: editServiceData.name, price: Number(editServiceData.price), departmentId: editServiceData.departmentId, isAvailable: editServiceData.isAvailable }),
            })
            if (res.ok) {
                const updated = await res.json()
                setServices(prev => prev.map(s => s.id === srvId ? updated : s))
                cancelEditService()
            }
        } catch (e) { console.error(e) }
    }

    // ─── Add Doctor ───────────────────────────────────────────────────────────
    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDoctor.name.trim() || !newDoctor.departmentId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/doctors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDoctor),
            })
            if (res.ok) {
                const created = await res.json()   // ✅ إصلاح الخطأ - await خارج الـ callback
                setDoctors(prev => [created, ...prev])
                setNewDoctor({ name: '', specialty: '', phone: '', workSchedule: '', departmentId: '' })
                setIsDoctorDialogOpen(false)
            }
        } catch (e) { console.error(e) }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>

    return (
        <div className="w-full px-4 py-6 space-y-6" dir="rtl">

            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">{hospital?.hospitalName || 'تفاصيل المستشفى'}</h1>
            </div>

            <div className="flex gap-1 border-b">
                {[{ key: 'departments', label: 'الأقسام' }, { key: 'services', label: 'الخدمات' }, { key: 'doctors', label: 'الأطباء' }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ══════════════ TAB: الأقسام ══════════════ */}
            {tab === 'departments' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأقسام: {departments.length}</p>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                                        <Plus className="w-4 h-4" /> إضافة قسم
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                    <DialogHeader><DialogTitle>إضافة قسم طبي جديد</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddDepartment} className="space-y-4 py-4 text-right">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">اسم القسم</label>
                                            <Input value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} placeholder="مثال: قسم الباطنة..." required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">التخصص / نوع القسم</label>
                                            <Select value={newDept.deptType} onValueChange={val => setNewDept({ ...newDept, deptType: val })}>
                                                <SelectTrigger><SelectValue placeholder="اختر تخصص القسم" /></SelectTrigger>
                                                <SelectContent>{deptTypesList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">حالة القسم</label>
                                            <Select value={newDept.status} onValueChange={val => setNewDept({ ...newDept, status: val })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="يعمل بكفاءة">يعمل بكفاءة</SelectItem>
                                                    <SelectItem value="خارج الخدمة">خارج الخدمة</SelectItem>
                                                    <SelectItem value="قيد الصيانة">قيد الصيانة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">وصف إضافي (اختياري)</label>
                                            <Input value={newDept.description} onChange={e => setNewDept({ ...newDept, description: e.target.value })} placeholder="تفاصيل إضافية..." />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting} className="bg-blue-600 w-full">
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null} حفظ القسم الجديد
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 border-b sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم القسم</th>
                                        <th className="p-4 font-semibold text-start">التخصص</th>
                                        <th className="p-4 font-semibold text-start">الحالة</th>
                                        <th className="p-4 font-semibold text-center w-28">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {departments.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">لا توجد أقسام مسجلة</td></tr>
                                    ) : departments.map(dept => {
                                        const isEditing = updatingId === dept.id
                                        return (
                                            <tr key={dept.id} className={`transition-colors ${isEditing ? 'bg-blue-50/40' : 'hover:bg-muted/30'}`}>
                                                <td className="p-4">
                                                    {isEditing && editRowData
                                                        ? <Input value={editRowData.name} onChange={e => setEditRowData({ ...editRowData, name: e.target.value })} className="h-8 max-w-[200px] bg-white" />
                                                        : <span className="font-semibold text-slate-800">{dept.name}</span>}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing && editRowData
                                                        ? <Select value={editRowData.deptType} onValueChange={val => setEditRowData({ ...editRowData, deptType: val })}>
                                                            <SelectTrigger className="h-8 w-48 bg-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{deptTypesList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                          </Select>
                                                        : <span className="text-slate-600">{dept.deptType}</span>}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing && editRowData
                                                        ? <Select value={editRowData.status} onValueChange={val => setEditRowData({ ...editRowData, status: val })}>
                                                            <SelectTrigger className="h-8 w-36 bg-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="يعمل بكفاءة">يعمل بكفاءة</SelectItem>
                                                                <SelectItem value="خارج الخدمة">خارج الخدمة</SelectItem>
                                                                <SelectItem value="قيد الصيانة">قيد الصيانة</SelectItem>
                                                            </SelectContent>
                                                          </Select>
                                                        : <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dept.status === 'يعمل بكفاءة' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{dept.status}</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing
                                                        ? <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleSaveInlineEdit(dept.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"><Check className="w-4 h-4" /></button>
                                                            <button onClick={cancelInlineEdit} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><X className="w-4 h-4" /></button>
                                                          </div>
                                                        : <button onClick={() => startInlineEdit(dept)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md"><Edit2 className="w-4 h-4" /></button>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ══════════════ TAB: الخدمات ══════════════ */}
            {tab === 'services' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الخدمات: {services.length}</p>
                            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                                        <Plus className="w-4 h-4" /> إضافة خدمة
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                    <DialogHeader><DialogTitle>إضافة خدمة جديدة</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddService} className="space-y-4 py-4 text-right">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">اسم الخدمة</label>
                                            <Input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="مثال: تحليل دم..." required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">السعر</label>
                                            <Input type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="0" required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">القسم التابع له</label>
                                            <Select value={newService.departmentId} onValueChange={val => setNewService({ ...newService, departmentId: val })}>
                                                <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                                                <SelectContent>
                                                    {departments.length > 0
                                                        ? departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)
                                                        : <SelectItem value="none" disabled>لا توجد أقسام</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting} className="bg-blue-600 w-full">
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null} حفظ الخدمة الجديدة
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم الخدمة</th>
                                        <th className="p-4 font-semibold text-start">القسم التابع له</th>
                                        <th className="p-4 font-semibold text-start">السعر</th>
                                        <th className="p-4 font-semibold text-center">الحالة</th>
                                        <th className="p-4 font-semibold text-center w-24">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {services.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">لا توجد خدمات مسجلة</td></tr>
                                    ) : services.map(srv => {
                                        const isEditing = editingServiceId === srv.id
                                        return (
                                            <tr key={srv.id} className={`transition-colors ${isEditing ? 'bg-blue-50/40' : 'hover:bg-muted/30'}`}>
                                                <td className="p-4">
                                                    {isEditing && editServiceData
                                                        ? <Input value={editServiceData.name} onChange={e => setEditServiceData({ ...editServiceData, name: e.target.value })} className="h-8 max-w-[180px] bg-white" />
                                                        : <span className="font-semibold text-slate-800">{srv.name}</span>}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing && editServiceData
                                                        ? <Select value={editServiceData.departmentId} onValueChange={val => setEditServiceData({ ...editServiceData, departmentId: val })}>
                                                            <SelectTrigger className="h-8 w-44 bg-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                                          </Select>
                                                        : <span className="text-slate-600">{srv.departmentName}</span>}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing && editServiceData
                                                        ? <Input type="number" value={editServiceData.price} onChange={e => setEditServiceData({ ...editServiceData, price: e.target.value })} className="h-8 w-24 bg-white" />
                                                        : <span className="font-mono text-blue-600 font-bold">{srv.price} ₪</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing && editServiceData
                                                        ? <Select value={editServiceData.isAvailable ? 'true' : 'false'} onValueChange={val => setEditServiceData({ ...editServiceData, isAvailable: val === 'true' })}>
                                                            <SelectTrigger className="h-8 w-32 mx-auto bg-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="true">متوفرة</SelectItem>
                                                                <SelectItem value="false">غير متوفرة</SelectItem>
                                                            </SelectContent>
                                                          </Select>
                                                        : <span className={`px-2 py-1 rounded-full text-xs font-semibold ${srv.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                            {srv.isAvailable ? 'متوفرة' : 'غير متوفرة'}
                                                          </span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing
                                                        ? <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleSaveServiceEdit(srv.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"><Check className="w-4 h-4" /></button>
                                                            <button onClick={cancelEditService} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><X className="w-4 h-4" /></button>
                                                          </div>
                                                        : <button onClick={() => startEditService(srv)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md"><Edit2 className="w-4 h-4" /></button>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ══════════════ TAB: الأطباء ══════════════ */}
            {tab === 'doctors' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأطباء: {doctors.length}</p>
                            <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                                        <Plus className="w-4 h-4" /> إضافة طبيب
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                    <DialogHeader><DialogTitle>إضافة طبيب جديد</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddDoctor} className="space-y-4 py-4 text-right">
                                        <Input placeholder="اسم الطبيب"  value={newDoctor.name}         onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}         required />
                                        <Input placeholder="التخصص"      value={newDoctor.specialty}    onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })}    />
                                        <Input placeholder="رقم الهاتف"  value={newDoctor.phone}        onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })}        />
                                        <Input placeholder="جدول العمل"  value={newDoctor.workSchedule} onChange={e => setNewDoctor({ ...newDoctor, workSchedule: e.target.value })} />
                                        <Select onValueChange={val => setNewDoctor({ ...newDoctor, departmentId: val })}>
                                            <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                                            <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting} className="w-full bg-blue-600">
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : 'حفظ بيانات الطبيب'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold">اسم الطبيب</th>
                                        <th className="p-4 font-semibold">التخصص</th>
                                        <th className="p-4 font-semibold">الهاتف</th>
                                        <th className="p-4 font-semibold">جدول العمل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {doctors.length === 0
                                        ? <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">لا يوجد أطباء مسجلون</td></tr>
                                        : doctors.map(doc => (
                                            <tr key={doc.id} className="hover:bg-muted/30">
                                                <td className="p-4">{doc.name}</td>
                                                <td className="p-4">{doc.specialty}</td>
                                                <td className="p-4" dir="ltr">{doc.phone}</td>
                                                <td className="p-4">{doc.workSchedule}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}