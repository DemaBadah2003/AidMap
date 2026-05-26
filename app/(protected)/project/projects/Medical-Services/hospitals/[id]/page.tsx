'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Loader2, Plus, Edit2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── الأنواع (Types) ──────────────────────────────────────────────────────────
type Hospital = { id: string; hospitalName: string; hospitalType: string; region: string; phone: string }
type Department = { id: string; name: string; deptType: string; status: string; description: string | null }
type Service = { id: string; name: string; price: number; isAvailable: boolean; departmentId: string; departmentName: string }
type Doctor = { id: string; name: string; specialty: string; phone: string; workSchedule: string; departmentId: string | null }

export default function HospitalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null) // لمعرفة أي سطر يتم تعديله حالياً
    const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('departments')
    
    const [hospital, setHospital] = useState<Hospital | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])

    // States الخاصة بإضافة قسم جديد
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newDept, setNewDept] = useState({ name: '', deptType: '', status: 'يعمل بكفاءة', description: '' })
    // State لإضافة خدمة جديدة
const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
const [newService, setNewService] = useState({ name: '', price: '', departmentId: '', isAvailable: true })
    // State الخاصة بحفظ البيانات المؤقتة للسطر الذي يتم تعديله حالياً (Inline Edit)
    const [editRowData, setEditRowData] = useState<{ name: string; deptType: string; status: string } | null>(null)
     const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
const [newDoctor, setNewDoctor] = useState({ 
    name: '', specialty: '', phone: '', workSchedule: '', departmentId: '' 
});
    // قائمة التخصصات الطبية المتاحة للاختيار منها (Droplist)
    const deptTypesList = [
        "الجراحة العامة",
        "طب الأطفال",
        "الاستقبال والطوارئ",
        "الأمراض الباطنية",
        "النساء والتوليد",
        "العناية المكثفة",
        "القلب والأوعية الدموية",
        "العظام والمفاصل",
        "العيون",
        "الأنف والأذن والحنجرة"
    ]

    // دالة جلب كافة البيانات بشكل منفصل وفوري عند تحميل الصفحة
    const fetchAllData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const hospitalRes = await fetch(`/api/project/Medical-Services/hospitals/${id}`)
            if (hospitalRes.ok) {
                const hospitalData = await hospitalRes.json()
                setHospital(hospitalData)
            }

            const deptsRes = await fetch(`/api/project/Medical-Services/hospitals/${id}/departments`)
            if (deptsRes.ok) {
                const deptsData = await deptsRes.json()
                setDepartments(deptsData || [])
            }

            const servicesRes = await fetch(`/api/project/Medical-Services/hospitals/${id}/services`)
            if (servicesRes.ok) {
                const servicesData = await servicesRes.json()
                setServices(servicesData || [])
            }

        } catch (error) {
            console.error("Error loading hospital details:", error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        if (id) {
            fetchAllData()
        }
    }, [id, fetchAllData])

    // دالة إضافة قسم جديد (POST)
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
                const createdDept = await res.json()
                setDepartments((prev) => [createdDept, ...prev])
                setNewDept({ name: '', deptType: '', status: 'يعمل بكفاءة', description: '' })
                setIsDialogOpen(false)
            } else {
                const errData = await res.json()
                alert(errData.error || 'فشلت عملية إضافة القسم')
            }
        } catch (error) {
            console.error('Error creating department:', error)
        } finally {
            setSubmitting(false)
        }
    }
    const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newService.name.trim() || !newService.price || !newService.departmentId) return

    setSubmitting(true)
    try {
        const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newService),
        })

        if (res.ok) {
            const createdService = await res.json()
            setServices((prev) => [createdService, ...prev])
            setNewService({ name: '', price: '', departmentId: '', isAvailable: true })
            setIsServiceDialogOpen(false)
        }
    } catch (error) {
        console.error('Error adding service:', error)
    } finally {
        setSubmitting(false)
    }
}

    

    // تفعيل وضع التعديل الفوري لسطر معين وتعبئة بياناته تلقائياً
    const startInlineEdit = (dept: Department) => {
        setUpdatingId(dept.id)
        setEditRowData({
            name: dept.name,
            deptType: dept.deptType,
            status: dept.status
        })
    }

    // إلغاء عملية التعديل وتصفير البيانات المؤقتة للسطر
    const cancelInlineEdit = () => {
        setUpdatingId(null)
        setEditRowData(null)
    }

    // دالة حفظ التعديلات الفورية وإرسالها لقاعدة البيانات (PATCH)
    const handleSaveInlineEdit = async (deptId: string) => {
        if (!editRowData || !editRowData.name.trim() || !editRowData.deptType.trim()) return

        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/departments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: deptId,
                    ...editRowData
                }),
            })

            if (res.ok) {
                setDepartments((prev) =>
                    prev.map((dept) =>
                        dept.id === deptId
                            ? { ...dept, name: editRowData.name, deptType: editRowData.deptType, status: editRowData.status }
                            : dept
                    )
                )
                setUpdatingId(null)
                setEditRowData(null)
            } else {
                const errData = await res.json()
                alert(errData.error || 'فشلت عملية تعديل القسم')
            }
        } catch (error) {
            console.error('Error updating department:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 space-y-6" dir="rtl">
            {/* الهيدر وعنوان المستشفى */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ArrowRight />
                </button>
                <h1 className="text-2xl font-bold">{hospital?.hospitalName || "تفاصيل المستشفى"}</h1>
            </div>

            {/* التبويبات العلوية */}
            <div className="flex gap-1 border-b">
                {[
                    { key: 'departments', label: 'الأقسام' },
                    { key: 'services', label: 'الخدمات' },
                    { key: 'doctors', label: 'الأطباء' }
                ].map(t => (
                    <button 
                        key={t.key} 
                        onClick={() => setTab(t.key as any)} 
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 1️⃣ تبويب الأقسام */}
            {tab === 'departments' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        {/* شريط الإجراءات العلوي للجدول */}
                        <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأقسام: {departments.length}</p>
                            
                            {/* زر إضافة قسم مدمج مع الـ Dialog النافذة المنبثقة */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                                        <Plus className="w-4 h-4" />
                                        إضافة قسم
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                    <DialogHeader>
                                        <DialogTitle className="text-right text-lg font-bold">إضافة قسم طبي جديد</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddDepartment} className="space-y-4 py-4 text-right">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">اسم القسم</label>
                                            <Input 
                                                value={newDept.name}
                                                onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                                                placeholder="مثال: قسم الباطنة، الطوارئ..." 
                                                required 
                                            />
                                        </div>
                                        
                                        {/* تعديل حقل التخصص إلى Droplist */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">التخصص / نوع القسم</label>
                                            <Select 
                                                value={newDept.deptType} 
                                                onValueChange={(val) => setNewDept({...newDept, deptType: val})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر تخصص القسم" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {deptTypesList.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">حالة العمل داخل القسم</label>
                                            <Select 
                                                value={newDept.status} 
                                                onValueChange={(val) => setNewDept({...newDept, status: val})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر حالة القسم" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="يعمل بكفاءة">يعمل بكفاءة</SelectItem>
                                                    <SelectItem value="خارج الخدمة">خارج الخدمة</SelectItem>
                                                    <SelectItem value="قيد الصيانة">قيد الصيانة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">وصف إضافي (اختياري)</label>
                                            <Input 
                                                value={newDept.description}
                                                onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                                                placeholder="تفاصيل إضافية عن القدرة الاستيعابية..." 
                                            />
                                        </div>
                                        <DialogFooter className="gap-2 pt-4">
                                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null}
                                                حفظ القسم الجديد
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* الجدول وعرض البيانات */}
                        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                            <table className="w-full text-sm text-start">
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
                                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">لا توجد أقسام مسجلة في قاعدة البيانات لهذا المستشفى</td></tr>
                                    ) : (
                                        departments.map(dept => {
                                            const isEditing = updatingId === dept.id;
                                            return (
                                                <tr key={dept.id} className={`transition-colors ${isEditing ? 'bg-blue-50/40 hover:bg-blue-50/50' : 'hover:bg-muted/30'}`}>
                                                    
                                                    {/* عمود اسم القسم */}
                                                    <td className="p-4">
                                                        {isEditing && editRowData ? (
                                                            <Input 
                                                                value={editRowData.name}
                                                                onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                                                                className="h-8 max-w-[200px] bg-white font-semibold"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-slate-800">{dept.name}</span>
                                                        )}
                                                    </td>

                                                    {/* عمود التخصص (تم تحويله أيضاً إلى Droplist أثناء التعديل السطري) */}
                                                    <td className="p-4">
                                                        {isEditing && editRowData ? (
                                                            <div className="w-48">
                                                                <Select 
                                                                    value={editRowData.deptType} 
                                                                    onValueChange={(val) => setEditRowData({ ...editRowData, deptType: val })}
                                                                >
                                                                    <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {deptTypesList.map((type) => (
                                                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-600">{dept.deptType}</span>
                                                        )}
                                                    </td>

                                                    {/* عمود الحالة */}
                                                    <td className="p-4">
                                                        {isEditing && editRowData ? (
                                                            <div className="w-36">
                                                                <Select 
                                                                    value={editRowData.status} 
                                                                    onValueChange={(val) => setEditRowData({ ...editRowData, status: val })}
                                                                >
                                                                    <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="يعمل بكفاءة">يعمل بكفاءة</SelectItem>
                                                                        <SelectItem value="خارج الخدمة">خارج الخدمة</SelectItem>
                                                                        <SelectItem value="قيد الصيانة">قيد الصيانة</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dept.status === 'يعمل بكفاءة' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                {dept.status}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* أزرار التحكم الفوري */}
                                                    <td className="p-4 text-center">
                                                        {isEditing ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button 
                                                                    onClick={() => handleSaveInlineEdit(dept.id)}
                                                                    className="p-1.5 text-green-600 hover:text-green-700 rounded-md hover:bg-green-50 transition-colors"
                                                                    title="حفظ التعديلات"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={cancelInlineEdit}
                                                                    className="p-1.5 text-red-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                                    title="إلغاء التعديل"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => startInlineEdit(dept)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                                                                title="تعديل في السطر"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
{/* 2️⃣ تبويب الخدمات */}
{tab === 'services' && (
    <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-0">
            {/* شريط الإجراءات العلوي للخدمات */}
            <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                <p className="font-semibold text-sm text-muted-foreground">إجمالي الخدمات: {services.length}</p>
                
                {/* زر إضافة خدمة */}
                <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                            <Plus className="w-4 h-4" />
                            إضافة خدمة
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-right text-lg font-bold">إضافة خدمة جديدة</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleAddService} className="space-y-4 py-4 text-right">
                            {/* حقل اسم الخدمة */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">اسم الخدمة</label>
                                <Input 
                                    value={newService.name}
                                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                                    placeholder="مثال: تحليل دم، أشعة سينية..." 
                                    required 
                                />
                            </div>

                            {/* حقل السعر */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">السعر</label>
                                <Input 
                                    type="number"
                                    value={newService.price}
                                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                                    placeholder="0" 
                                    required 
                                />
                            </div>
                            
                            {/* اختيار القسم التابع للخدمة */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">القسم التابع له</label>
                                <Select 
                                    value={newService.departmentId} 
                                    onValueChange={(val) => setNewService({...newService, departmentId: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر القسم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.length > 0 ? (
                                            departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>لا توجد أقسام متاحة</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="gap-2 pt-4">
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                    {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null}
                                    حفظ الخدمة الجديدة
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* الجدول الخاص بالخدمات */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                    <thead className="bg-muted/40 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-start">اسم الخدمة</th>
                            <th className="p-4 font-semibold text-start">القسم التابع له</th>
                            <th className="p-4 font-semibold text-start">السعر</th>
                            <th className="p-4 font-semibold text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {services.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">لا توجد خدمات مسجلة</td></tr>
                        ) : (
                            services.map(srv => (
                                <tr key={srv.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4 font-semibold text-slate-800">{srv.name}</td>
                                    <td className="p-4 text-slate-600">{srv.departmentName}</td>
                                    <td className="p-4 font-mono text-blue-600 font-bold">{srv.price} ₪</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${srv.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {srv.isAvailable ? 'متوفرة' : 'غير متوفرة'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
)}{tab === 'doctors' && (
    <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-0">
            {/* رأس التبويب مع زر إضافة طبيب */}
            <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                <p className="font-semibold text-sm text-muted-foreground">إجمالي الأطباء: {doctors.length}</p>
                
                <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                            <Plus className="w-4 h-4" /> إضافة طبيب
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة طبيب جديد</DialogTitle>
                        </DialogHeader>


                        
                        <form onSubmit={handleAddDoctor} className="space-y-4 py-4 text-right">
                            <Input 
                                placeholder="اسم الطبيب" 
                                value={newDoctor.name} 
                                onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})} 
                                required 
                            />
                            <Input 
                                placeholder="التخصص" 
                                value={newDoctor.specialty} 
                                onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})} 
                            />
                            <Input 
                                placeholder="رقم الهاتف" 
                                value={newDoctor.phone} 
                                onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})} 
                            />
                            <Input 
                                placeholder="جدول العمل" 
                                value={newDoctor.workSchedule} 
                                onChange={(e) => setNewDoctor({...newDoctor, workSchedule: e.target.value})} 
                            />
                            
                            <Select onValueChange={(val) => setNewDoctor({...newDoctor, departmentId: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر القسم" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
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

            {/* جدول الأطباء */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                    <thead className="bg-muted/40 border-b">
                        <tr>
                            <th className="p-4 font-semibold">اسم الطبيب</th>
                            <th className="p-4 font-semibold">التخصص</th>
                            <th className="p-4 font-semibold">الهاتف</th>
                            <th className="p-4 font-semibold">جدول العمل</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {doctors.map(doc => (
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