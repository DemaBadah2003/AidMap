'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { requireCitizen } from '@/app/(protected)/project/helpers/route-guards'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'

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
  const router = useRouter()

  useEffect(() => {
    requireCitizen(router)
  }, [router])

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
      await fetch('/api/project/users/registerBeneficiary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'CITIZEN' }),
      })

      setSuccessMsg('تم إنشاء حساب المستفيد بنجاح')
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        numberOfFamily: '',
      })
    } catch (error: any) {
      setErrorMsg('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full py-4 sm:py-6 md:py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] px-3 xs:px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center px-1">
            <h1 className="text-lg font-bold leading-tight sm:text-xl md:text-2xl">
              إضافة مستفيد جديد
            </h1>
            <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
              قم بإدخال بيانات المستفيد لإتمام عملية التسجيل
            </p>
          </div>

          <Card className="rounded-xl border bg-background shadow-sm sm:rounded-2xl">
            <CardContent className="p-3 sm:p-5">
              <div className="space-y-3 text-sm sm:space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground sm:text-sm">
                    الاسم الكامل
                  </label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className="h-10 text-sm sm:h-11"
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500">{errors.name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground sm:text-sm">
                    البريد الإلكتروني
                  </label>
                  <Input
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="h-10 text-sm sm:h-11"
                  />
                  {errors.email && (
                    <span className="text-xs text-red-500">{errors.email}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground sm:text-sm">
                    كلمة المرور
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    className="h-10 text-sm sm:h-11"
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500">{errors.password}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground sm:text-sm">
                    رقم الهاتف
                  </label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    inputMode="numeric"
                    className="h-10 text-sm sm:h-11"
                  />
                  {errors.phone && (
                    <span className="text-xs text-red-500">{errors.phone}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground sm:text-sm">
                    عدد أفراد الأسرة
                  </label>
                  <Input
                    name="numberOfFamily"
                    value={form.numberOfFamily}
                    onChange={onChange}
                    inputMode="numeric"
                    className="h-10 text-sm sm:h-11"
                  />
                  {errors.numberOfFamily && (
                    <span className="text-xs text-red-500">
                      {errors.numberOfFamily}
                    </span>
                  )}
                </div>
              </div>

              {(successMsg || errorMsg || errors.general) && (
                <div className="pt-3">
                  {successMsg && (
                    <p className="text-xs font-medium text-green-600 sm:text-sm">
                      {successMsg}
                    </p>
                  )}
                  {errorMsg && (
                    <p className="text-xs font-medium text-red-500 sm:text-sm">
                      {errorMsg}
                    </p>
                  )}
                  {errors.general && (
                    <p className="text-xs font-medium text-red-500 sm:text-sm">
                      {errors.general}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full text-xs sm:h-9 sm:w-auto sm:px-4"
                  onClick={() =>
                    setForm({
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      numberOfFamily: '',
                    })
                  }
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  className="h-10 w-full text-xs sm:h-9 sm:w-auto sm:px-4"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}