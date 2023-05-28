import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
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

      const filteredUser = filterUserForClient(user);

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
          id: filteredUser.id,
          username: filteredUser.username,
          profileImageUrl: filteredUser.profileImageUrl,
          followersCount: 0,
          followsCount: 0,
          postsCount: 0,
          isFollowing: false,
        };
      }

      return {
        id: filteredUser.id,
        username: filteredUser.username,
        profileImageUrl: filteredUser.profileImageUrl,
        followersCount: profile._count.followers,
        followsCount: profile._count.follows,
        postsCount: profile._count.posts,
        isFollowing: profile.followers.length > 0,
      };
    }),
  toggleFollow: privateProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input: { username }, ctx }) => {
      const currentUserId = ctx.userId;

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
