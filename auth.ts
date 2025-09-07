import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getUserById } from "./modules/auth/actions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ user, account }) {
      if (!user || !account) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      let newUser;
      if (!existingUser) {
        newUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email!,
            image: user.image,

            accounts: {
              create: {
                provider: account.provider,
                type: account.type,
                providerAccountId: account.providerAccountId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at,
                tokenType: account.token_type,
                scope: account.scope,
                idToken: account.id_token,
                sessionState:
                  account.session_state !== undefined &&
                  account.session_state !== null
                    ? String(account.session_state)
                    : null,
              },
            },
          },
        });
      }

      if (!existingUser && !newUser) return false;

      let existingAccount;
      if (existingUser) {
        existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });
      }

      if (existingUser && !existingAccount) {
        await prisma.account.create({
          data: {
            userId: existingUser!.id,
            provider: account.provider,
            type: account.type,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
            sessionState:
              account.session_state !== undefined &&
              account.session_state !== null
                ? String(account.session_state)
                : null,
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role!;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;

      return token;
    },
  },
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
