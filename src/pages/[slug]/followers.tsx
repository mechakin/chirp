import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import Link from "next/link";
import { IconHoverEffect } from "~/components/iconhovereffect";
import { VscArrowLeft } from "react-icons/vsc";
import { NotFound } from "~/components/notfound";
import { FollowView } from "~/components/followview";

function FollowerHeader(props: { username: string }) {
  const handleJumpUpClick = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <header className="sticky top-0 z-10 flex items-center  bg-black p-[0.625rem]">
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
      </div>
    </header>
  );
}

export const FollowerFeed = (props: { username: string }) => {
  const { data, isLoading } = api.profile.getFollowersByUsername.useQuery({
    username: props.username,
  });

  if (!data) return <NotFound />;

  if (data.followers && data.followers.length === 0)
    return <div className="p-4">User has not followed anyone.</div>;

  return (
    <div className="flex flex-col">
      {data.followers &&
        data.followers.map((follow) => (
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

const FollwersPage: NextPage<{ username: string }> = ({ username }) => {
  return (
    <>
      <Head>
        <title>
          {username}
          {"'s"} followers
        </title>
      </Head>
      <PageLayout>
        <FollowerHeader username={username} />
        <FollowerFeed username={username} />
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

  await ssg.profile.getFollowersByUsername.prefetch({ username });

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

export default FollwersPage;
