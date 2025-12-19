import { useAuth, useUser } from "@clerk/chrome-extension"
import { useEffect, useRef, useState } from "react"

import { createSupabaseClient } from "../../../core/supabase"

const getOgTitleFromPage = () => {
  const ogTitle =
    document
      .querySelector('meta[property="og:title"], meta[name="og:title"]')
      ?.getAttribute("content") ?? ""
  return ogTitle || document.title || ""
}

export const Home = () => {
  const currentUrlRef = useRef("")
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { isSignedIn, user, isLoaded } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        setIsLoading(false)
        return
      }

      const activeTab = tabs[0]
      if (!activeTab?.id) {
        setIsLoading(false)
        return
      }

      currentUrlRef.current = activeTab.url ?? ""

      chrome.scripting.executeScript(
        { target: { tabId: activeTab.id }, func: getOgTitleFromPage },
        (results) => {
          const fallbackTitle = activeTab.title ?? ""
          if (chrome.runtime.lastError) {
            setTitle(fallbackTitle)
            setIsLoading(false)
            return
          }

          setTitle(results?.[0]?.result || fallbackTitle)
          setIsLoading(false)
        }
      )
    })
  }, [])

  const handleSave = async () => {
    if (isSaving) return
    if (!user?.id) {
      setErrorMessage("로그인이 필요합니다.")
      return
    }

    const url = currentUrlRef.current
    if (!url) {
      setErrorMessage("URL을 찾지 못했습니다.")
      return
    }

    setIsSaving(true)
    setErrorMessage("")

    try {
      const accessToken = await getToken()
      if (!accessToken) {
        setErrorMessage("인증 토큰을 가져오지 못했습니다.")
        return
      }

      const supabase = createSupabaseClient(accessToken)
      const { error } = await supabase.from("links").insert({
        user_id: user.id,
        url,
        title
      })

      if (error) {
        setErrorMessage(`${error.code} ${error.message}`)
      }
    } catch (error) {
      console.error("Save failed:", error)
      setErrorMessage("네트워크 오류로 저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="h-40 flex items-center justify-center">Loading...</div>
    )
  }

  return isSignedIn ? (
    <main className="flex flex-col gap-3 p-4">
      <div>
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          placeholder={
            isLoading ? "OG 타이틀 불러오는 중..." : "OG 타이틀 입력"
          }
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isLoading}
        />
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}
      <button
        className="rounded-md bg-neutral-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void handleSave()}
        disabled={isLoading || isSaving}>
        {isSaving ? "Saving..." : chrome.i18n.getMessage("save")}
      </button>
    </main>
  ) : (
    <div className="flex flex-col justify-center items-center ">
      <h1 className="font-black text-5xl font-anton uppercase">
        {chrome.i18n.getMessage("extensionName")}
      </h1>
      <h2 className="text-lg font-">
        {chrome.i18n.getMessage("extensionDescription")}
      </h2>
    </div>
  )
}
