import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
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
          credentials.password,
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

        await prisma.user.update({
          where: { id: user.id },
          data: { lastSignInAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Anonymous",
          roleId: user.roleId,
          roleName: user.role?.name ?? null,
          roleSlug: user.role?.slug ?? null,
          status: user.status,
          avatar: user.avatar,
        } as any;
      },
    }),

    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   allowDangerousEmailAccountLinking: true,
    //
    //   profile(profile) {
    //     return {
    //       id: profile.sub ?? profile.id,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture,
    //     };
    //   },
    // }),
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
        const u = user as any;
        token.id = u.id ?? token.sub;
        (token as any).roleId = u.roleId;
        (token as any).roleName = u.roleName;
        (token as any).roleSlug = u.roleSlug;
        (token as any).status = u.status;
        (token as any).avatar = u.avatar;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).roleId = (token as any).roleId;
        (session.user as any).roleName = (token as any).roleName;
        (session.user as any).roleSlug = (token as any).roleSlug;
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