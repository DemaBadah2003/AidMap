"use client";

import { useState, type ChangeEvent } from "react";
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

  const validateField = (name: keyof FormData, value: string) => {
    switch (name) {
      case "email":
        if (!value) return "البريد الإلكتروني مطلوب";
        if (!/\S+@\S+\.\S+/.test(value)) return "البريد الإلكتروني غير صالح";
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

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const onSubmit = async () => {
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
          email: form.email,
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
          throw new Error(data?.message || "فشل التحقق من صحة البيانات");
        }

        throw new Error(data?.message || "فشل تسجيل الدخول");
      }

      setSuccessMsg("تم تسجيل الدخول بنجاح");

      // مؤقتًا: بعد نجاح الدخول نحول المستخدم
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      setErrorMsg(error.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-md mx-auto mt-10 border rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
      <p className="text-sm text-gray-500 mb-6">أدخل البريد الإلكتروني وكلمة المرور</p>

      <div className="mb-4">
        <label className="block mb-1">البريد الإلكتروني</label>
        <input
          name="email"
          type="text"
          value={form.email}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          placeholder="example@gmail.com"
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="mb-4">
        <label className="block mb-1">كلمة المرور</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
        />
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
      </div>

      {successMsg && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
      >
        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </div>
  );
}