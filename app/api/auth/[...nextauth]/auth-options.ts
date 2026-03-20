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
        console.log("========== AUTH START ==========");
        console.log("Incoming credentials:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          rememberMe: credentials?.rememberMe,
        });

        try {
          if (
            !credentials ||
            typeof credentials.email !== "string" ||
            typeof credentials.password !== "string"
          ) {
            console.error("AUTH ERROR: Missing or invalid email/password format");
            throw new Error(
              JSON.stringify({
                code: 400,
                message: "Please enter both email and password.",
              })
            );
          }

          console.log("Step 1: Looking for user by email:", credentials.email);

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("Step 2: User query result:", user
            ? {
                id: user.id,
                email: user.email,
                hasPassword: !!user.password,
                status: user.status,
                roleId: user.roleId,
                name: user.name,
              }
            : null
          );

          if (!user) {
            console.error("AUTH ERROR: User not found");
            throw new Error(
              JSON.stringify({
                code: 404,
                message: "User not found. Please register first.",
              })
            );
          }

          if (!user.password) {
            console.error("AUTH ERROR: User exists but has no password stored");
            throw new Error(
              JSON.stringify({
                code: 401,
                message: "This account does not have a password set.",
              })
            );
          }

          console.log("Step 3: Comparing password...");

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("Step 4: Password comparison result:", isPasswordValid);

          if (!isPasswordValid) {
            console.error("AUTH ERROR: Invalid password");
            throw new Error(
              JSON.stringify({
                code: 401,
                message: "Invalid credentials. Incorrect password.",
              })
            );
          }

          // لو بدك تفعيلي فحص الحالة، فعّلي هذا الجزء:
          /*
          console.log("Step 5: Checking user status:", user.status);

          if (user.status !== "ACTIVE") {
            console.error("AUTH ERROR: User is not active");
            throw new Error(
              JSON.stringify({
                code: 403,
                message: "Account not activated. Please verify your email.",
              })
            );
          }
          */

          console.log("Step 6: Updating lastSignInAt...");

          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() },
          });

          console.log("Step 7: Authentication success for user:", {
            id: user.id,
            email: user.email,
            status: user.status,
          });

          console.log("========== AUTH SUCCESS ==========");

          return {
            id: user.id,
            email: user.email,
            name: user.name || "Anonymous",
            roleId: user.roleId,
            status: user.status,
            avatar: user.avatar,
          } as any;
        } catch (error: any) {
          console.error("========== AUTH FAILED ==========");
          console.error("Authorize catch error:", error);

          if (error instanceof Error) {
            console.error("Error message:", error.message);
          }

          throw error;
        }
      },
    }),

    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,

      profile(profile) {
        return {
          id: profile.sub ?? profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    */
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("JWT CALLBACK:", {
        hasUser: !!user,
        trigger,
        tokenSub: token.sub,
      });

      if (trigger === "update" && session?.user) {
        console.log("JWT update trigger, merging session.user into token");
        return { ...token, ...(session.user as any) };
      }

      if (user) {
        const u = user as any;
        token.id = u.id ?? token.sub;
        (token as any).roleId = u.roleId;
        (token as any).status = u.status;
        (token as any).avatar = u.avatar;

        console.log("JWT enriched with user data:", {
          id: token.id,
          roleId: (token as any).roleId,
          status: (token as any).status,
        });
      }

      return token;
    },

    async session({ session, token }) {
      console.log("SESSION CALLBACK:", {
        sessionUserExists: !!session.user,
        tokenId: (token as any).id,
      });

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

  debug: true,
};

export default authOptions;