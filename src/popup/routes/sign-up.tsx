import { SignUp } from "@clerk/chrome-extension"

export const SignUpPage = () => {
  return (
    <main className="plasmo-w-full plasmo-h-full plasmo-flex plasmo-justify-center plasmo-items-center">
      <SignUp
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
