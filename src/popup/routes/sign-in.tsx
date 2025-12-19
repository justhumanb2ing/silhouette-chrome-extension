import { SignIn } from "@clerk/chrome-extension"

export const SignInPage = () => {
  return (
    <main className="plasmo-w-full plasmo-h-full plasmo-flex plasmo-justify-center plasmo-items-center">
      <SignIn
        routing="virtual"
        appearance={{
          elements: {
            socialButtonsRoot: "plasmo-hidden",
            dividerRow: "plasmo-hidden"
          }
        }}
      />
    </main>
  )
}
