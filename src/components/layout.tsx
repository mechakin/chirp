import Link from "next/link";
import { type PropsWithChildren } from "react";
import { useUser, useClerk, SignInButton, UserButton } from "@clerk/nextjs";
import { VscAccount, VscHome, VscSignIn, VscSignOut } from "react-icons/vsc";
import { IconHoverEffect } from "./iconHoverEffect";

export function SideNav() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <nav className="sticky top-0">
      <ul className="flex min-h-screen flex-col items-start gap-2 whitespace-nowrap py-2 px-4">
        <li>
          <Link href="/">
            <IconHoverEffect>
              <span className="flex items-center gap-4">
                <VscHome className="h-8 w-8" />
                <span className="hidden text-lg md:inline">Home</span>
              </span>
            </IconHoverEffect>
          </Link>
        </li>
        {user && user.username && (
          <li>
            <Link href={`/@${user.username}`}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscAccount className="h-8 w-8" />
                  <span className="hidden text-lg md:inline">Profile</span>
                </span>
              </IconHoverEffect>
            </Link>
          </li>
        )}
        {!user && (
          <li>
            <SignInButton mode="modal">
              <button>
                <IconHoverEffect>
                  <span className="flex items-center gap-4">
                    <VscSignIn className="h-8 w-8 " />
                    <span className="hidden text-lg md:inline">Log In</span>
                  </span>
                </IconHoverEffect>
              </button>
            </SignInButton>
          </li>
        )}
        {user && (
          <li>
            <button onClick={() => void signOut()}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignOut className="h-8 w-8 " />
                  <span className="hidden text-lg md:inline">Log Out</span>
                </span>
              </IconHoverEffect>
            </button>
          </li>
        )}
        {user && (
          <li className="absolute bottom-6 right-4 flex md:right-6">
            <UserButton
              appearance={{
                elements: {
                  // see if you can change on hover classes
                  userButtonAvatarBox: {
                    width: 48,
                    height: 48,
                  },
                },
              }}
            />
          </li>
        )}
      </ul>
    </nav>
  );
}

export function PageLayout(props: PropsWithChildren) {
  const { user } = useUser();

  return (
    <main className="container mx-auto flex items-start justify-center">
      <SideNav />
      <div className="min-h-screen flex-grow border-x border-slate-400 md:max-w-2xl">
        {props.children}
      </div>
      {!user && <div className="md:w-36" />}
      {user && <div className="md:w-40" />}
    </main>
  );
}
