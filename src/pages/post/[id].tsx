import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { PostView } from "~/components/postview";
import { IconHoverEffect } from "~/components/iconhovereffect";
import { VscArrowLeft } from "react-icons/vsc";
import Link from "next/link";
import { NotFound } from "~/components/notfound";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.posts.getById.useQuery({ id });

  if (!data) return <NotFound />;

  function Header() {
    const handleJumpUpClick = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    return (
      <header
        className="flex w-full cursor-pointer bg-black p-2"
        onClick={handleJumpUpClick}
      >
        <Link href=".." className="mr-2">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6" />
          </IconHoverEffect>
        </Link>
        <p className="py-2">Post</p>
      </header>
    );
  }

  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <Header></Header>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  // make it so you return to a different page instead
  if (typeof id !== "string") throw new Error("No id.");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
