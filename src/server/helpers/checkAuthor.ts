import { type inferAsyncReturnType } from "@trpc/server";
import { type createTRPCContext } from "../api/trpc";

export async function checkAuthor(
  ctx: inferAsyncReturnType<typeof createTRPCContext>,
  userId: string
) {
  const author = await ctx.prisma.user.findUnique({
    where: { id: userId },
  });

  if (author) return;

  await ctx.prisma.user.create({
    data: { id: userId },
  });

  return;
}
