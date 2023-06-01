import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { NotFound } from "~/components/notfound";
import { FollowView } from "~/components/followview";

function FollowingHeader(props: { username: string }) {
  const handleJumpUpClick = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <header className="flex w-full cursor-pointer items-center bg-black p-[0.625rem]">
      <Link href={`/@${props.username}`} className="mr-2">
        <IconHoverEffect>
          <VscArrowLeft className="h-6 w-6" />
        </IconHoverEffect>
      </Link>
      <div
        className="w-full cursor-pointer bg-black"
        onClick={handleJumpUpClick}
      >
        <p>@{props.username}</p>
      </div>
    </header>
  );
}

export const FollowingFeed = (props: { username: string }) => {
  const { data, isLoading } = api.profile.getFollowingByUsername.useQuery({
    username: props.username,
  });

  if (!data) return <NotFound />;

  if (data.following && data.following.length === 0)
    return <div className="p-4">User has not followed anyone.</div>;

  return (
    <div className="flex flex-col">
      {data.following &&
        data.following.map((follow) => (
          <FollowView {...follow} key={follow.id} />
        ))}
      {isLoading && (
        <div className="pb-2">
          <LoadingPage />
        </div>
      )}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  return (
    <>
      <Head>
        <title>following {username}</title>
      </Head>
      <PageLayout>
        <FollowingHeader username={username} />
        <FollowingFeed username={username} />
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

  await ssg.profile.getFollowingByUsername.prefetch({ username });

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
