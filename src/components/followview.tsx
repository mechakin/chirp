import Link from "next/link";
import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import router from "next/router";
import { NotFound } from "../components/notfound";

type Following =
  RouterOutputs["profile"]["getFollowingByUsername"]["following"][number];

type Followers =
  RouterOutputs["profile"]["getFollowersByUsername"]["followers"][number];

export function FollowView(props: Following | Followers) {
  const { id, username, profileImageUrl } = props;

  if (!username) return <NotFound />;

  function handleOuterLink(event: React.MouseEvent) {
    event.preventDefault();
    if (username) void router.push(`/@${username}`);
  }

  function handleInnerLink(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div
      key={id}
      className="relative flex cursor-pointer items-center gap-3 p-4"
      onClick={handleOuterLink}
    >
      <Link href={`/@${username}`} onClick={handleInnerLink} className="h-14">
        <Image
          src={profileImageUrl}
          alt={`@${username}'s profile picture`}
          className="h-14 w-14 rounded-full"
          width={56}
          height={56}
        />
      </Link>

      <Link href={`/@${username}`} className="z-10" onClick={handleInnerLink}>
        <span className="z-10 text-xl hover:underline font-semibold">{`@${username}`}</span>
      </Link>
    </div>
  );
}
