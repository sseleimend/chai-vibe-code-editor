"use server";

import { prisma } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";

export const getAllPlaygroundsForUser = async () => {
  try {
    const user = await currentUser();

    const playgrounds = await prisma.playground.findMany({
      where: { userId: user?.id },
      include: {
        user: true,
        starMark: {
          where: { userId: user?.id },
          select: { isMarked: true },
        },
      },
    });

    return playgrounds;
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    throw new Error("Failed to fetch playgrounds");
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "ANGULAR" | "VUE" | "NEXT" | "EXPRESS" | "HONO";
  description?: string;
}) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    const { template, title, description } = data;

    const playground = await prisma.playground.create({
      data: {
        title,
        template,
        description,
        userId: user.id as string,
      },
    });

    return playground;
  } catch (error) {
    console.error("Error creating playground:", error);
    throw new Error("Failed to create playground");
  }
};

export const deletePlayground = async (playgroundId: string) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");
    await prisma.playground.delete({
      where: {
        id: playgroundId,
        userId: user.id as string,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting playground:", error);
    throw new Error("Failed to delete playground");
  }
};

export const editPlayground = async (
  playgroundId: string,
  data: {
    title: string;
    description: string;
  }
) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    const { title, description } = data;

    await prisma.playground.update({
      where: {
        id: playgroundId,
        userId: user.id as string,
      },
      data: {
        title,
        description,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error editing playground:", error);
    throw new Error("Failed to edit playground");
  }
};

export const duplicatePlayground = async (playgroundId: string) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");
    const existingPlayground = await prisma.playground.findUnique({
      where: {
        id: playgroundId,
      },
    });
    if (!existingPlayground)
      throw new Error("Playground not found for duplication");
    await prisma.playground.create({
      data: {
        title: existingPlayground.title + " (Copy)",
        description: existingPlayground.description,
        template: existingPlayground.template,
        userId: user.id as string,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error duplicating playground:", error);
    throw new Error("Failed to duplicate playground");
  }
};

export const toggleStarMark = async (
  playgroundId: string,
  isMarked: boolean
) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    if (isMarked) {
      await prisma.starMark.create({
        data: {
          playgroundId,
          userId: user.id as string,
          isMarked: true,
        },
      });
    } else {
      await prisma.starMark.delete({
        where: {
          userId_playgroundId: {
            playgroundId,
            userId: user.id as string,
          },
        },
      });
    }

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error toggling star mark:", error);
    throw new Error("Failed to toggle star mark");
  }
};
