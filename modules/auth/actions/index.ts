"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
    return await prisma.account.findMany({
      where: { userId },
    });
  } catch (error) {
    console.error("Error fetching accounts by user ID:", error);
    return null;
  }
};

export const currentUser = async () => {
  const user = await auth();
  if (!user) return null;
  return user.user;
};
