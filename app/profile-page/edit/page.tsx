'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: 'Ahmed',
    email: 'ahmed4@gmail.com',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saved:', formData);
  };

  return (
    <div className="w-full py-10">
      <div className="mx-auto w-full max-w-[800px] px-6 space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your personal information.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl border bg-background p-5 shadow-sm"
        >
          <h3 className="mb-4 font-semibold">Account Info</h3>

          <div className="space-y-4 text-sm">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/profile-page"
                className="h-9 rounded-md border px-4 text-xs font-medium hover:bg-muted flex items-center justify-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white hover:opacity-90 flex items-center justify-center"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}