import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignOutButton
} from "@clerk/chrome-extension"
import { Link, Outlet, useNavigate } from "react-router"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST
const IS_DEV = process.env.NODE_ENV === "development"

if (!PUBLISHABLE_KEY || !SYNC_HOST) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY and PLASMO_PUBLIC_CLERK_SYNC_HOST to the .env.development file"
  )
}

export const RootLayout = () => {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      appearance={{
        theme: "simple"
      }}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      syncHost={SYNC_HOST}>
      <div className="w-[400px] h-[300px]flex flex-col justify-between gap-3">
        <header className="flex justify-between items-center border-b p-3 py-2">
          <div className="flex items-center gap-2">
            <Link to={"/"}>
              <span className="font-anton text-xl uppercase">Silhouette</span>
            </Link>
          </div>
          <div className="mr-2">
            <SignedIn>
              <SignOutButton>{chrome.i18n.getMessage("signOut")}</SignOutButton>
            </SignedIn>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <SignedOut>
          <button
            className="rounded-md bg-neutral-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
            onClick={() =>
              chrome.tabs.create({
                url: `${SYNC_HOST + (IS_DEV ? ":5173" : "")}/en/sign-in`
              })
            }>
            {chrome.i18n.getMessage("signIn")}
          </button>
        </SignedOut>
      </div>
    </ClerkProvider>
  )
}
