import { SignIn } from "@clerk/chrome-extension"

export const SignInPage = () => {
  return (
    <main className="w-full h-full flex justify-center items-center">
      <SignIn
        routing="virtual"
        appearance={{
          elements: {
            socialButtonsRoot: "hidden",
            dividerRow: "hidden"
          }
        }}
      />
    </main>
  )
}
