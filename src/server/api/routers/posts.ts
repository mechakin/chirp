import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { type inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import { type Prisma } from "@prisma/client";
import { ratelimit } from "~/server/helpers/rateLimiter";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
  type createTRPCContext,
} from "~/server/api/trpc";
import { checkAuthor } from "~/server/helpers/checkAuthor";

type Post = {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
};

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author || !author.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });
    }

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

async function getInfinitePosts({
  whereClause,
  ctx,
  limit,
  cursor,
}: {
  whereClause?: Prisma.PostWhereInput;
  limit: number;
  cursor: { id: string; createdAt: Date } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currentUserId = ctx.userId;

  const data = await ctx.prisma.post.findMany({
    take: limit + 1,
    cursor: cursor ? { createdAt_id: cursor } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: whereClause,
    select: {
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes:
        currentUserId == null ? false : { where: { authorId: currentUserId } },
      author: { select: { id: true } },
    },
  });

  let nextCursor: typeof cursor | undefined;
  if (data.length > limit) {
    const nextItem = data.pop();
    if (nextItem != null) {
      nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt };
    }
  }

  const posts = data.map((post) => {
    return {
      id: post.id,
      authorId: post.author.id,
      content: post.content,
      createdAt: post.createdAt,
      likeCount: post._count.likes,
      likedByMe: post.likes?.length > 0,
    };
  });

  const hydratedPosts = await addUserDataToPosts(posts);

  return {
    posts: hydratedPosts,
    nextCursor,
  };
}

export const postsRouter = createTRPCRouter({
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        username: z.string(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(async ({ input: { limit = 20, username, cursor }, ctx }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [username],
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found.",
        });
      }

      return await getInfinitePosts({
        limit,
        ctx,
        cursor,
        whereClause: { authorId: user.id },
      });
    }),
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFollowing: z.boolean().optional(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(
      async ({ ctx, input: { limit = 20, onlyFollowing = false, cursor } }) => {
        const currentUserId = ctx.userId;

        return await getInfinitePosts({
          limit,
          ctx,
          cursor,
          whereClause:
            currentUserId == null || !onlyFollowing
              ? undefined
              : {
                  author: {
                    followers: { some: { id: currentUserId } },
                  },
                },
        });
      }
    ),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed!").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input: { content } }) => {
      const user = ctx.userId;

      await checkAuthor(ctx, user);

      const post = await ctx.prisma.post.create({
        data: { content, authorId: user },
      });

      return post;
    }),
  toggleLike: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input: { id } }) => {
      const user = ctx.userId;

      await checkAuthor(ctx, user);

      const data = { postId: id, authorId: ctx.userId };

      const { success } = await ratelimit.limit(ctx.userId);

      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const existingLike = await ctx.prisma.like.findUnique({
        where: { authorId_postId: data },
      });

      if (existingLike == null) {
        await ctx.prisma.like.create({ data });
        return { addedLike: true };
      } else {
        await ctx.prisma.like.delete({ where: { authorId_postId: data } });
        return { addedLike: false };
      }
    }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.userId;

      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          authorId: true,
          content: true,
          createdAt: true,
          _count: { select: { likes: true } },
          likes:
            currentUserId == null
              ? false
              : { where: { authorId: currentUserId } },
          author: { select: { id: true } },
        },
      });

      if (!post)
        throw new TRPCError({ code: "NOT_FOUND", message: "Posts not found." });

      const hydratedPost = {
        id: post.id,
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt,
        likeCount: post._count.likes,
        likedByMe: post.likes?.length > 0,
      };

      return (await addUserDataToPosts([hydratedPost]))[0];
    }),
});
