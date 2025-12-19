import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@clerk/chrome-extension"
import { Link, Outlet, useNavigate } from "react-router"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

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
              <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-text-sm">
                <Link to="/sign-in">{chrome.i18n.getMessage("signIn")}</Link>
                <Link to="/sign-up">{chrome.i18n.getMessage("signUp")}</Link>
              </div>
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
