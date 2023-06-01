import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postview";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { NotFound } from "~/components/notfound";
import { getPlural } from "~/lib/utils";
import { useState } from "react";

const TABS = ["Posts", "Likes"] as const;

function ProfileHeader(props: {
  username: string;
  postsCount: number;
  isFollowing: boolean;
}) {
  const { user, isSignedIn } = useUser();

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.profile.toggleFollow.useMutation(
    {
      onSuccess: ({ addedFollow }) => {
        ctx.profile.getUserByUsername.setData(
          { username: props.username },
          (oldData) => {
            if (oldData == null) return;

            const countModifier = addedFollow ? 1 : -1;
            return {
              ...oldData,
              isFollowing: addedFollow,
              followersCount: oldData.followersCount + countModifier,
            };
          }
        );
      },
      onError: (event) => {
        const errorMessage = event.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0]);
        } else {
          toast.error("Failed to follow! Please try again later.");
        }
      },
    }
  );

  const handleJumpUpClick = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <header className="sticky top-0 z-10 flex items-center  bg-black p-2">
      <Link href=".." className="mr-2">
        <IconHoverEffect>
          <VscArrowLeft className="h-6 w-6" />
        </IconHoverEffect>
      </Link>
      <div
        className="w-full cursor-pointer bg-black"
        onClick={handleJumpUpClick}
      >
        <p>@{props.username}</p>
        <p className="text-sm">
          {props.postsCount} {getPlural(props.postsCount, "Post", "Posts")}
        </p>
      </div>
      {user?.username !== props.username && isSignedIn && (
        <button
          className={`mr-2 rounded-full border border-slate-400 p-2 px-4 ${
            props.isFollowing ? "bg-transparent" : "bg-slate-600"
          }`}
          disabled={isPosting}
          onClick={() => mutate({ username: props.username })}
        >
          {props.isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </header>
  );
}

export const ProfileFeed = (props: { username: string }) => {
  const { ref, inView } = useInView();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetching } =
    api.posts.infiniteProfileFeed.useInfiniteQuery(
      {
        username: props.username,
      },
      { getNextPageParam: (lastpage) => lastpage.nextCursor }
    );

  const posts = data?.pages.flatMap((post) => post.posts);

  if (isLoading) return <LoadingPage />;

  if (!data || (posts && posts.length === 0))
    return <div className="p-4">User has not posted.</div>;

  if (inView && hasNextPage && !isFetching) {
    void fetchNextPage();
  }

  return (
    <div className="flex flex-col">
      {posts &&
        posts.map((fullPost) => (
          <PostView {...fullPost} key={fullPost.post.id} />
        ))}
      <span ref={ref} className={hasNextPage ? "invisible" : "hidden"}>
        intersection observer marker
      </span>
      {isLoading && (
        <div className="pb-2">
          <LoadingPage />
        </div>
      )}
    </div>
  );
};

export const LikeFeed = (props: { username: string }) => {
  const { ref, inView } = useInView();

  const { data, isLoading, hasNextPage, isFetching, fetchNextPage } =
    api.posts.infiniteLikeFeed.useInfiniteQuery(
      { username: props.username },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const posts = data?.pages.flatMap((post) => post.posts);

  if (isLoading) return <LoadingPage />;

  if (!data || (posts && posts.length === 0))
    return <div className="p-4">User has not liked a post.</div>;

  if (inView && hasNextPage && !isFetching) {
    void fetchNextPage();
  }

  return (
    <div className="flex flex-col">
      {posts &&
        posts.map((fullPost) => (
          <PostView {...fullPost} key={fullPost?.post.id} />
        ))}
      <span ref={ref} className={hasNextPage ? "invisible" : "hidden"}>
        intersection observer marker
      </span>
      {isLoading && (
        <div className="pb-2">
          <LoadingPage />
        </div>
      )}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    username,
  });

  const [selectedTab, setSelectedTab] =
    useState<(typeof TABS)[number]>("Posts");

  if (!data) return <NotFound />;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <ProfileHeader
          username={username}
          postsCount={data.postsCount}
          isFollowing={data.isFollowing}
        />
        <div className="relative h-36 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={`${data.username ?? ""}'s profile picture`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-16 ml-4 rounded-full border-4 border-black bg-black"
          />
        </div>
        <div className="h-16"></div>
        <div className="p-4 text-2xl font-medium">{`@${
          data.username ?? ""
        }`}</div>
        <div className="flex w-full  pl-4 pb-2">
          <Link
            href={`/@${username}/following`}
            className="pr-4 hover:underline"
          >
            {data.followsCount}{" "}
            <span className="font-thin text-slate-300">Following</span>
          </Link>
          <Link
            href={`/@${username}/followers`}
            className="pb-2 hover:underline"
          >
            {data.followersCount}{" "}
            <span className="font-thin text-slate-300">
              {getPlural(data.followersCount, "Follower", "Followers")}
            </span>
          </Link>
        </div>

        <div className="flex bg-black">
          {TABS.map((tab) => {
            return (
              <button
                key={tab}
                className={`flex-grow bg-black p-2 hover:bg-slate-700 focus-visible:bg-slate-700 ${
                  tab === selectedTab ? "border-b-4 border-b-slate-500" : ""
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
        {selectedTab === "Posts" ? (
          <ProfileFeed username={username} />
        ) : (
          <LikeFeed username={username} />
        )}
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  // make it so you return to a different page instead
  if (typeof slug !== "string") throw new Error("No slug.");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
