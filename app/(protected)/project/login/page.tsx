"use client";

import { FormEvent, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name: keyof FormData, value: string) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "البريد الإلكتروني مطلوب";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "البريد الإلكتروني غير صالح";
        }
        return "";

      case "password":
        if (!value) return "كلمة المرور مطلوبة";
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {
      email: validateField("email", form.email),
      password: validateField("password", form.password),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, value),
      general: "",
    }));

    setErrorMsg("");
    setSuccessMsg("");
  };

  const isFormReady = useMemo(() => {
    return form.email.trim() !== "" && form.password.trim() !== "";
  }, [form.email, form.password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});
    setErrorMsg("");
    setSuccessMsg("");

    const isValid = validateForm();

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/project/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data?.issues) {
          const apiErrors: FormErrors = {};

          for (const issue of data.issues) {
            if (issue.field) {
              apiErrors[issue.field as keyof FormErrors] = issue.message;
            }
          }

          setErrors(apiErrors);
          setErrorMsg(data?.message || "فشل التحقق من صحة البيانات");
          return;
        }

        throw new Error(data?.message || "فشل تسجيل الدخول");
      }

      setSuccessMsg(data?.message || "تم تسجيل الدخول بنجاح");

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        router.push("/project/MapPreview");
      }, 700);
    } catch (error: any) {
      setErrorMsg(error?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#f7f1e8] px-4 py-8"
    >
      {/* إخفاء أيقونة العين الافتراضية الخاصة بالمتصفح */}
      <style jsx>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }

        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-textfield-decoration-container {
          display: none !important;
          visibility: hidden;
          pointer-events: none;
          position: absolute;
          right: 0;
        }
      `}</style>

      {/* زخرفة أعلى اليمين */}
      <div className="pointer-events-none absolute right-0 top-0 h-[220px] w-[220px] rounded-bl-[220px] bg-[#df8768]" />
      <div className="pointer-events-none absolute right-[18px] top-[18px] h-[175px] w-[175px] rounded-full border border-[#efc2b1]" />
      <div className="pointer-events-none absolute right-[30px] top-[30px] h-[150px] w-[150px] rounded-full border border-[#efc2b1]" />

      {/* زخرفة أسفل اليسار */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 rounded-tr-full border-t border-r border-[#efc2b1]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[28px] bg-[#fbf6ee] px-6 py-10 shadow-[0_18px_40px_rgba(90,64,47,0.08)] sm:px-8">
          <div className="mb-8 text-right">
            <p className="mb-2 text-xs font-bold tracking-wide text-[#c58e77]">
              نظام إدارة المساعدات
            </p>

            <p className="mt-3 text-sm font-medium leading-6 text-[#6f6a64]">
              أدخل البريد الإلكتروني وكلمة المرور للوصول إلى حسابك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-extrabold text-[#3f3a36]"
              >
                البريد الإلكتروني
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="أدخل البريد الإلكتروني"
                className={`h-12 w-full rounded-xl border bg-[#f8efe3] px-4 text-sm font-semibold text-[#2b2b2b] outline-none transition placeholder:font-medium placeholder:text-[#b7a999] ${
                  errors.email
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#ead7c6] focus:border-[#d7a38c]"
                }`}
              />

              {errors.email && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-extrabold text-[#3f3a36]"
              >
                كلمة المرور
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور"
                  className={`h-12 w-full rounded-xl border bg-[#f8efe3] pr-4 pl-12 text-sm font-semibold text-[#2b2b2b] outline-none transition placeholder:font-medium placeholder:text-[#b7a999] ${
                    errors.password
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#ead7c6] focus:border-[#d7a38c]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 left-0 flex w-12 items-center justify-center text-[#d49478] transition hover:text-[#bf7f63]"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 1.96-3.89 3.54-5.35" />
                      <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-4.06 5.94" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {errors.password}
                </p>
              )}

              <div className="mt-2 text-right">
                <button
                  type="button"
                  className="text-xs font-bold text-[#e1997f] transition hover:text-[#cb7e61]"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={loading || !isFormReady}
                className="mx-auto flex h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </div>
          </form>

          <div className="mt-24">
            <div className="flex items-center gap-5">
              <div className="h-px flex-1 bg-[#d8cec2]" />
              <span className="px-2 text-xs font-medium text-[#9c9389]">
                أو المتابعة عبر
              </span>
              <div className="h-px flex-1 bg-[#d8cec2]" />
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e6d7ca] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
                aria-label="Google"
              >
                <svg viewBox="0 0 48 48" className="h-5 w-5">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.91 2.34 30.37 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.03 6.24C12.48 13.55 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.55c0-1.64-.15-3.21-.41-4.73H24v9.02h12.66c-.55 2.98-2.24 5.5-4.77 7.19l7.33 5.69C43.77 37.52 46.5 31.57 46.5 24.55z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.59 28.54A14.5 14.5 0 0 1 9.5 24c0-1.58.27-3.11.75-4.54l-8.03-6.24A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.22 10.78l8.37-6.24z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.92-2.13 15.89-5.79l-7.33-5.69c-2.04 1.37-4.66 2.18-8.56 2.18-6.26 0-11.52-4.05-13.41-9.96l-8.37 6.24C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e6d7ca] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                  className="h-5 w-5"
                >
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.009 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.017 1.792-4.683 4.533-4.683 1.313 0 2.686.235 2.686.235v2.963H15.83c-1.49 0-1.955.925-1.955 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.082 24 18.092 24 12.073z" />
                </svg>
              </button>
            </div>

            <div className="mt-8 text-center">
              <span className="text-sm font-medium text-[#7d7a74]">
                ليس لديك حساب؟
              </span>
              <button
                type="button"
                className="mr-2 text-sm font-extrabold text-[#1f2857] transition hover:underline"
              >
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}