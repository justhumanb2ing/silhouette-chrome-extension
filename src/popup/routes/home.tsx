import { useEffect, useRef, useState } from "react"

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

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs font-medium text-slate-500">
        현재 보고 있는 페이지의 OG 타이틀
      </p>
      <input
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        placeholder={isLoading ? "OG 타이틀 불러오는 중..." : "OG 타이틀 입력"}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isLoading}
      />
    </div>
  )
}
