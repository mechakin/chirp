import { type AppType } from "next/app";

import { api } from "~/utils/api";
import Head from "next/head";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>Chirp</title>
        <meta name="description" content="Twitter but it's only emojis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
