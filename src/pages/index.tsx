import { type NextPage } from "next";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import LoadingSpinner, { LoadingPage } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";
import { useInView } from "react-intersection-observer";

const TABS = ["Recent", "Following"] as const;

function CreatePostWizard() {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.infiniteFeed.invalidate();
    },
    onError: (event) => {
      const errorMessage = event.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3 bg-black">
      <Image
        src={user.profileImageUrl}
        alt={user.username ? `@${user.username}'s profile picture` : ""}
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={isPosting}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
      />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
}

function RecentFeed() {
  const { ref, inView } = useInView();

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = api.posts.infiniteFeed.useInfiniteQuery(
    {},
    { getNextPageParam: (lastpage) => lastpage.nextCursor }
  );

  const posts = data?.pages.flatMap((post) => post.posts);

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div className="p-[1.125rem]">Something went wrong!</div>;

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
      {postsLoading && (
        <div className="pb-2">
          <LoadingPage />
        </div>
      )}
    </div>
  );
}

function FollowingFeed() {
  const { ref, inView } = useInView();

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = api.posts.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true },
    { getNextPageParam: (lastpage) => lastpage.nextCursor }
  );

  const posts = data?.pages.flatMap((post) => post.posts);

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong!</div>;

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
      {postsLoading && (
        <div className="pb-2">
          <LoadingPage />
        </div>
      )}
    </div>
  );
}

function Header() {
  const handleJumpUpClick = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <header
      className="w-full cursor-pointer bg-black p-[1.125rem]"
      onClick={handleJumpUpClick}
    >
      <p className="">Home</p>
    </header>
  );
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  const [selectedTab, setSelectedTab] =
    useState<(typeof TABS)[number]>("Recent");

  // return empty div if BOTH aren't loaded, since user tends to load faster
  if (!userLoaded) return <div />;

  return (
    <PageLayout>
      <div className="sticky top-0">
        <Header />
        {isSignedIn && (
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
        )}
      </div>
      {isSignedIn && (
        <div className="flex border-b border-slate-400 p-4">
          <CreatePostWizard />
        </div>
      )}

      {selectedTab === "Recent" ? <RecentFeed /> : <FollowingFeed />}
    </PageLayout>
  );
};

export default Home;
