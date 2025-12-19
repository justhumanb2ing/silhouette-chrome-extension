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
      <div className="plasmo-w-[500px] plasmo-h-[600px] plasmo-p-3 plasmo-flex plasmo-flex-col plasmo-gap-3">
        <header className="plasmo-flex plasmo-justify-between plasmo-items-center">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
            <Link to={"/"}>
              <span className="plasmo-font-anton plasmo-text-2xl plasmo-uppercase plasmo-tracking-tighter">
                Silhouette
              </span>
            </Link>
          </div>
          <footer>
            <SignedIn>
              <SignOutButton>{chrome.i18n.getMessage("signOut")}</SignOutButton>
            </SignedIn>
            <SignedOut>
              <button
                className="plasmo-rounded-md plasmo-bg-slate-900 plasmo-px-3 plasmo-py-1.5 plasmo-text-sm plasmo-font-medium plasmo-text-white plasmo-transition hover:plasmo-bg-slate-800"
                onClick={() =>
                  chrome.tabs.create({
                    url: `${SYNC_HOST + (IS_DEV ? ":5173" : "")}/en/sign-in`
                  })
                }>
                {chrome.i18n.getMessage("signIn")}
              </button>
            </SignedOut>
          </footer>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </ClerkProvider>
  )
}
