import { type NextPage } from "next";
import { SignInButton, useUser } from "@clerk/nextjs";
import { api, type RouterOutputs } from "~/utils/api";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import LoadingSpinner, { LoadingPage } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import PageLayout from "~/components/layout";

dayjs.extend(relativeTime);

function CreatePostWizard() {
  const { user } = useUser();

  // use react hook form instead of this
  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
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
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="profile image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
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

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

function PostView(props: PostWithUser) {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImageUrl}
        alt={`@${author.username}'s profile picture`}
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      {/* might not need the flex stuff here */}
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <span>
            <Link href={`/@${author.username}`}>
              <span>{`@${author.username}`}</span>
            </Link>
            <Link href={`/post/${post.id}`}>
              <span className="font-thin">{` · ${dayjs(
                post.createdAt
              ).fromNow()}`}</span>
            </Link>
          </span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
}

function Feed() {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong!</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // start fetching asap
  api.posts.getAll.useQuery();

  // return empty div if BOTH aren't loaded, since user tends to load faster
  if (!userLoaded) return <div />;

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4">
        {isSignedIn && <CreatePostWizard />}
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
