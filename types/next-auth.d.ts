import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      avatar?: string | null;
      roleId?: string | null;
      roleName?: string | null;
      status?: string; // ✅ كان required
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    avatar?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    status?: string; // ✅ كان required
    // name/email موجودين أصلًا في NextAuth كاختياريين، مش لازم تعيد تعريفهم
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string; // ✅ خليه optional
    avatar?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    status?: string; // ✅ كان required
    // name/email موجودين أصلًا في JWT غالبًا، وممكن تسيبهم
  }
}

export {};
