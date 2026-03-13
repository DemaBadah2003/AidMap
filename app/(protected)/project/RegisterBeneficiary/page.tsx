'use client'

import { useState, type ChangeEvent } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

type FormData = {
  name: string
  email: string
  password: string
  phone: string
  numberOfFamily: string
}

type FormErrors = {
  name?: string
  email?: string
  password?: string
  phone?: string
  numberOfFamily?: string
  general?: string
}

const arabicNameRegex = /^[\u0600-\u06FF\s]+$/
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/
const phoneRegex = /^(056|059)\d{7}$/
const twoDigitsRegex = /^\d{2}$/

export default function RegisterBeneficiaryPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    numberOfFamily: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const validateField = (name: keyof FormData, value: string) => {
    switch (name) {
      case 'name':
        if (!value) return 'الاسم مطلوب'
        if (value.trim().length === 0) return 'الاسم مطلوب'
        if (value !== value.trim()) return 'الاسم لا يجب أن يبدأ أو ينتهي بمسافة'
        if (!arabicNameRegex.test(value)) {
          return 'الاسم يجب أن يكون باللغة العربية فقط'
        }
        if (/\s{2,}/.test(value)) {
          return 'لا يمكن وضع أكثر من مسافة بين الكلمات'
        }
        return ''

      case 'email':
        if (!value) return 'البريد الإلكتروني مطلوب'
        if (value !== value.trim()) return 'البريد الإلكتروني لا يجب أن يبدأ أو ينتهي بمسافة'
        if (!emailRegex.test(value)) {
          return 'البريد الإلكتروني يجب أن يكون بالإنجليزية قبل @، ويحتوي على @، وينتهي بـ .com'
        }
        return ''

      case 'password':
        if (!value.trim()) return 'كلمة المرور مطلوبة'
        if (value.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        return ''

      case 'phone':
        if (!value) return 'رقم الجوال مطلوب'
        if (!/^\d+$/.test(value)) return 'رقم الجوال يجب أن يحتوي على أرقام فقط'
        if (!phoneRegex.test(value)) {
          return 'رقم الجوال يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
        }
        return ''

      case 'numberOfFamily':
        if (!value) return 'عدد أفراد الأسرة مطلوب'
        if (!/^\d+$/.test(value)) return 'عدد أفراد الأسرة يجب أن يحتوي على أرقام فقط'
        if (!twoDigitsRegex.test(value)) {
          return 'عدد أفراد الأسرة يجب أن يكون مكونًا من رقمين فقط'
        }
        return ''

      default:
        return ''
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      phone: validateField('phone', form.phone),
      numberOfFamily: validateField('numberOfFamily', form.numberOfFamily),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === 'phone' || name === 'numberOfFamily') {
      nextValue = value.replace(/\D/g, '')
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, nextValue),
      general: '',
    }))

    setErrorMsg('')
    setSuccessMsg('')
  }

  const onSubmit = async () => {
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    setErrors({})

    const isValid = validateForm()

    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/project/beneficiary/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          numberOfFamily: form.numberOfFamily,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : null

      if (!res.ok) {
        if (res.status === 400 && data?.issues) {
          const apiErrors: FormErrors = {}

          for (const issue of data.issues) {
            if (issue.field) {
              apiErrors[issue.field as keyof FormErrors] = issue.message
            }
          }

          setErrors(apiErrors)
          throw new Error(data?.message || 'فشل التحقق من صحة البيانات')
        }

        if (res.status === 409 && data?.field) {
          setErrors((prev) => ({
            ...prev,
            [data.field]: data.message,
          }))
          throw new Error(data.message || 'البيانات مكررة')
        }

        throw new Error(data?.message || 'فشل في التسجيل')
      }

      setSuccessMsg('تم إنشاء حساب المستفيد بنجاح')
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        numberOfFamily: '',
      })
      setErrors({})
    } catch (error: any) {
      setErrorMsg(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Register Beneficiary</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Beneficiary Registration</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-4">
              <div className="text-lg font-semibold text-right">تسجيل مستفيد جديد</div>
              <div className="mt-1 text-sm text-muted-foreground text-right">
                أدخل بيانات المستفيد لإنشاء حساب جديد على المنصة
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div dir="rtl" className="grid grid-cols-1 gap-4 max-w-[700px] ms-auto">
                <div className="grid gap-2">
                  <div className="text-sm">الاسم الكامل</div>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="مثال: سارة أحمد"
                    className="h-10"
                    autoComplete="off"
                  />
                  {errors.name && (
                    <div className="text-sm text-red-600 text-right">{errors.name}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">البريد الإلكتروني</div>
                  <Input
                    name="email"
                    type="text"
                    value={form.email}
                    onChange={onChange}
                    placeholder="example@gmail.com"
                    className="h-10"
                    autoComplete="off"
                  />
                  {errors.email && (
                    <div className="text-sm text-red-600 text-right">{errors.email}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">كلمة المرور</div>
                  <Input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    className="h-10"
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <div className="text-sm text-red-600 text-right">{errors.password}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">رقم الهاتف</div>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="059XXXXXXX"
                    className="h-10"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {errors.phone && (
                    <div className="text-sm text-red-600 text-right">{errors.phone}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">عدد أفراد الأسرة</div>
                  <Input
                    name="numberOfFamily"
                    type="text"
                    value={form.numberOfFamily}
                    onChange={onChange}
                    placeholder="مثال: 12"
                    className="h-10"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={2}
                  />
                  {errors.numberOfFamily && (
                    <div className="text-sm text-red-600 text-right">{errors.numberOfFamily}</div>
                  )}
                </div>
              </div>

              {successMsg && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 text-right max-w-[700px] ms-auto">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 text-right max-w-[700px] ms-auto">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 flex items-center justify-start max-w-[700px] ms-auto">
                <Button
                  className="!h-10 !rounded-lg !bg-blue-600 !px-5 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}