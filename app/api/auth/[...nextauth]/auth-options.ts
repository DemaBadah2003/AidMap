import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

const DEMO_EMAIL = "demabadah4@gmail.com";
const DEMO_PASSWORD = "demabadah12345678910D@";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "checkbox" },
      },

      async authorize(credentials) {
        // ✅ Fix: narrow types (unknown -> string)
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          throw new Error(
            JSON.stringify({
              code: 400,
              message: "Please enter both email and password.",
            })
          );
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // ✅ دخول ديمو سريع (يحافظ على تجربة Metronic) حتى لو DB فاضية
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          return {
            id: "demo-user",
            email: DEMO_EMAIL,
            name: "Demo User",
            roleId: null,
            status: "ACTIVE",
            avatar: null,
          } as any;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error(
            JSON.stringify({
              code: 404,
              message: "User not found. Please register first.",
            })
          );
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password ?? ""
        );

        if (!isPasswordValid) {
          throw new Error(
            JSON.stringify({
              code: 401,
              message: "Invalid credentials. Incorrect password.",
            })
          );
        }

        if (user.status !== "ACTIVE") {
          throw new Error(
            JSON.stringify({
              code: 403,
              message: "Account not activated. Please verify your email.",
            })
          );
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastSignInAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Anonymous",
          roleId: user.roleId,
          status: user.status,
          avatar: user.avatar,
        } as any;
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,

      profile(profile) {
        // NextAuth يحتاج object فيه على الأقل id/email/name
        return {
          id: profile.sub ?? (profile as any).id,
          name: profile.name,
          email: profile.email,
          image: (profile as any).picture,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        return { ...token, ...(session.user as any) };
      }

      if (user) {
        // خزّن أي بيانات إضافية في التوكن
        const u = user as any;
        token.id = u.id ?? token.sub;
        (token as any).roleId = u.roleId;
        (token as any).status = u.status;
        (token as any).avatar = u.avatar;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).roleId = (token as any).roleId;
        (session.user as any).status = (token as any).status;
        (session.user as any).avatar = (token as any).avatar;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
};

export default authOptions;