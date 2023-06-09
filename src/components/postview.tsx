import { api, type RouterOutputs } from "~/utils/api";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["infiniteFeed"]["posts"][number];
type LikeWithUser = RouterOutputs["posts"]["infiniteLikeFeed"]["posts"][number];

export function PostView(props: PostWithUser | LikeWithUser) {
  const trpcUtils = api.useContext();
  const router = useRouter();
  const toggleLike = api.posts.toggleLike.useMutation({
    onSuccess: async () => {
      await trpcUtils.posts.infiniteFeed.invalidate();
      await trpcUtils.posts.infiniteProfileFeed.invalidate();
    },
    onError: (event) => {
      const errorMessage = event.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to follow! Please try again later.");
      }
    },
  });

  const { post, author } = props;

  function handleToggleLike(event: React.MouseEvent) {
    event.stopPropagation();
    toggleLike.mutate({ id: post.id });
  }

  function handleOuterLink(event: React.MouseEvent) {
    event.preventDefault();
    void router.push(`/post/${post.id}`);
  }

  function handleInnerLink(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div
      key={post.id}
      className="relative flex cursor-pointer gap-3 border-b border-slate-400 p-4"
      onClick={handleOuterLink}
    >
      <Link
        href={`/@${author.username}`}
        onClick={handleInnerLink}
        className="h-14"
      >
        <Image
          src={author.profileImageUrl}
          alt={`@${author.username}'s profile picture`}
          className="h-14 w-14 rounded-full"
          width={56}
          height={56}
        />
      </Link>
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <span>
            <Link
              href={`/@${author.username}`}
              className="z-10"
              onClick={handleInnerLink}
            >
              <span className="z-10 hover:underline">{`@${author.username}`}</span>
            </Link>
            {"  ·  "}
            <Link href={`/post/${post.id}`}>
              <span className="font-thin hover:underline">{`${dayjs(
                post.createdAt
              ).fromNow()}`}</span>
            </Link>
          </span>
        </div>
        <span className="text-2xl">{post.content}</span>
        <HeartButton
          onClick={handleToggleLike}
          isLoading={toggleLike.isLoading}
          likedByMe={post.likedByMe}
          likeCount={post.likeCount}
        />
      </div>
    </div>
  );
}

type HeartButtonProps = {
  onClick: (event: React.MouseEvent) => void;
  isLoading: boolean;
  likedByMe: boolean;
  likeCount: number;
};

function HeartButton({
  isLoading,
  onClick,
  likedByMe,
  likeCount,
}: HeartButtonProps) {
  const { isSignedIn } = useUser();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (!isSignedIn) {
    return (
      <div
        className={`z-10 mt-2 flex items-center gap-3 self-start text-gray-500`}
      >
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`group flex items-center gap-1 self-start pt-2 transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <div className="p-1">
        <HeartIcon
          className={`transition-colors duration-150 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500 "
          }`}
        />
      </div>
      <span>{likeCount}</span>
    </button>
  );
}
