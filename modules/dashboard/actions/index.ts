"use server";

import { prisma } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";

export const getAllPlaygroundsForUser = async () => {
  try {
    const user = await currentUser();

    const playgrounds = await prisma.playground.findMany({
      where: { userId: user?.id },
      include: {
        user: true,
      },
    });

    return playgrounds;
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    throw new Error("Failed to fetch playgrounds");
  }
};
