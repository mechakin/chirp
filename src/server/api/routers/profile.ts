import { clerkClient } from "@clerk/nextjs/server";
import { type User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
} from "~/server/api/trpc";
import { checkAuthor } from "~/server/helpers/checkAuthor";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

const addUserDataToUsers = async (users: User[]) => {
  const flatUsers = users.flatMap((user) => user.id);

  return (
    await clerkClient.users.getUserList({
      userId: flatUsers,
    })
  ).map(filterUserForClient);
};

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input: { username } }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [username],
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found.",
        });
      }

      const currentUserId = ctx.userId;

      const profile = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          _count: { select: { followers: true, follows: true, posts: true } },
          followers:
            currentUserId == null
              ? undefined
              : { where: { id: currentUserId } },
        },
      });

      if (profile == null) {
        await ctx.prisma.user.create({
          data: { id: user.id },
        });

        return {
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          followersCount: 0,
          followsCount: 0,
          postsCount: 0,
          isFollowing: false,
        };
      }

      return {
        id: user.id,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        followersCount: profile._count.followers,
        followsCount: profile._count.follows,
        postsCount: profile._count.posts,
        isFollowing: profile.followers.length > 0,
      };
    }),
  getFollowingByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input: { username } }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [username],
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found.",
        });
      }

      const profile = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          follows: true,
        },
      });

      if (profile == null) {
        await ctx.prisma.user.create({
          data: { id: user.id },
        });

        return {
          following: [],
        };
      }

      if (profile.follows.length === 0) {
        return { following: [] };
      }

      const hydratedFollows = await addUserDataToUsers(profile.follows);

      return {
        following: hydratedFollows,
      };
    }),
  getFollowersByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input: { username } }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [username],
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found.",
        });
      }

      const profile = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: { followers: true },
      });

      if (profile == null) {
        await ctx.prisma.user.create({
          data: { id: user.id },
        });

        return {
          followers: [],
        };
      }

      if (profile.followers.length === 0) {
        return { followers: [] };
      }

      const hydratedFollowers = await addUserDataToUsers(profile.followers);

      return {
        followers: hydratedFollowers,
      };
    }),
  toggleFollow: privateProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input: { username }, ctx }) => {
      const currentUserId = ctx.userId;

      await checkAuthor(ctx, currentUserId);

      const [user] = await clerkClient.users.getUserList({
        username: [username],
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found.",
        });
      }

      const existingFollow = await ctx.prisma.user.findFirst({
        where: { id: user.id, followers: { some: { id: currentUserId } } },
      });

      let addedFollow;
      if (existingFollow == null) {
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { followers: { connect: { id: currentUserId } } },
        });
        addedFollow = true;
      } else {
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { followers: { disconnect: { id: currentUserId } } },
        });
        addedFollow = false;
      }

      return { addedFollow };
    }),
});
