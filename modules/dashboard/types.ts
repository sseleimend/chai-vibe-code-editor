import { Playground, StarMark, User } from "@prisma/client";

export interface Project extends Playground {
  user: User;
  starMark: { isMarked: boolean }[];
}
