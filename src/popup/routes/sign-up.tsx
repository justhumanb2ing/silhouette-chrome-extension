import { SignUp } from "@clerk/chrome-extension"

export const SignUpPage = () => {
  return (
    <main className="w-full h-full flex justify-center items-center">
      <SignUp
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
