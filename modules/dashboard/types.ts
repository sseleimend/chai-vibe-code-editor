import { Playground, User } from "@prisma/client";

export interface Project extends Playground {
  user: User;
}
