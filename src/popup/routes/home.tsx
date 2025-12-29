import { useAuth, useUser } from "@clerk/chrome-extension"
import { useEffect, useRef, useState } from "react"

import { createSupabaseClient } from "../../../core/supabase"

const NEW_CATEGORY_VALUE = "__new__"
const TITLE_LOADING_PLACEHOLDER = "OG 타이틀 불러오는 중..."
const TITLE_READY_PLACEHOLDER = "OG 타이틀 입력"

type Category = {
  id: string
  name: string
}

type CrawlResponse = {
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  site_name?: string | null
  url?: string | null
  icon?: string | null
}

const queryActiveTab = () =>
  new Promise<chrome.tabs.Tab | null>((resolve, reject) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      resolve(tabs?.[0] ?? null)
    })
  })

export const Home = () => {
  const currentUrlRef = useRef("")
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const { isSignedIn, user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const isNewCategorySelected = selectedCategoryId === NEW_CATEGORY_VALUE
  const isBusy = isLoading || isSaving
  const isCategoryBusy = isCategoriesLoading || isSaving
  
  useEffect(() => {
    let isMounted = true

    const loadActiveTab = async () => {
      try {
        const activeTab = await queryActiveTab()
        if (!activeTab?.id) return

        const fallbackTitle = activeTab.title ?? ""
        currentUrlRef.current = activeTab.url ?? ""
        if (isMounted) {
          setTitle(fallbackTitle)
        }
      } catch (error) {
        console.error("Load active tab failed:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadActiveTab()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return

    let isMounted = true

    const loadCategories = async () => {
      setIsCategoriesLoading(true)

      try {
        const accessToken = await getToken()
        if (!accessToken) {
          if (isMounted) {
            setErrorMessage("인증 토큰을 가져오지 못했습니다.")
          }
          return
        }

        const supabase = createSupabaseClient(accessToken)
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true })

        if (error) {
          if (isMounted) {
            setErrorMessage(`${error.code} ${error.message}`)
          }
          return
        }

        if (isMounted) {
          setCategories(data ?? [])
        }
      } catch (error) {
        if (isMounted) {
          console.error("Load categories failed:", error)
          setErrorMessage("카테고리를 불러오지 못했습니다.")
        }
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false)
        }
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [getToken, isLoaded, isSignedIn, user?.id])

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
      const accessToken = await getToken({})
      if (!accessToken) {
        setErrorMessage("인증 토큰을 가져오지 못했습니다.")
        return
      }

      const supabase = createSupabaseClient(accessToken)
      let categoryId: string | null = null

      if (selectedCategoryId === NEW_CATEGORY_VALUE) {
        const trimmedName = newCategoryName.trim()
        if (!trimmedName) {
          setErrorMessage("새 카테고리 이름을 입력해주세요.")
          return
        }
        if (trimmedName.length > 50) {
          setErrorMessage("카테고리 이름은 50자 이내로 입력해주세요.")
          return
        }

        const existingCategory = categories.find(
          (category) =>
            category.name.toLowerCase() === trimmedName.toLowerCase()
        )

        if (existingCategory) {
          categoryId = existingCategory.id
        } else {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              user_id: user.id,
              name: trimmedName
            })
            .select("id, name")
            .single()

          if (error) {
            setErrorMessage(`${error.code} ${error.message}`)
            return
          }

          if (data) {
            categoryId = data.id
            setCategories((prev) => [...prev, data])
            setSelectedCategoryId(data.id)
          }
        }
      } else if (selectedCategoryId) {
        categoryId = selectedCategoryId
      }

      const crawlResponse = await fetch("http://localhost:8000/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ url })
      })

      if (!crawlResponse.ok) {
        setErrorMessage("크롤링 요청에 실패했습니다.")
        return
      }

      const data = (await crawlResponse.json()).data as CrawlResponse

      const { error } = await supabase.from("links").insert({
        user_id: user.id,
        url,
        title: data.title,
        description: data.description,
        image_url: data.imageUrl,
        category_id: categoryId
      })

      if (error) {
        setErrorMessage(`${error.code} ${error.message}`)
      }
    } catch (error) {
      console.error("Save failed:", error)
      setErrorMessage(
        "네트워크 오류로 저장에 실패했습니다." + error.message + error
      )
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
    <main className="flex flex-col gap-4 p-4">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
        aria-busy={isBusy}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-700">
            링크 제목
          </label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
            placeholder={
              isLoading ? TITLE_LOADING_PLACEHOLDER : TITLE_READY_PLACEHOLDER
            }
            value={title}
            onChange={(event) => {
              if (errorMessage) {
                setErrorMessage("")
              }
              setTitle(event.target.value)
            }}
            disabled={isBusy}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">
              카테고리
            </label>
            {isCategoriesLoading ? (
              <span className="text-[11px] text-slate-500">불러오는 중...</span>
            ) : null}
          </div>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
            value={selectedCategoryId}
            onChange={(event) => {
              if (errorMessage) {
                setErrorMessage("")
              }
              setSelectedCategoryId(event.target.value)
            }}
            disabled={isCategoryBusy}>
            {isCategoriesLoading && categories.length === 0 ? (
              <option value="">카테고리 불러오는 중...</option>
            ) : null}
            <option value="">카테고리 없음</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={NEW_CATEGORY_VALUE}>+ 새 카테고리</option>
          </select>
        </div>
        {isNewCategorySelected ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-700">
              새 카테고리 이름
            </label>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
              placeholder="새 카테고리 이름"
              value={newCategoryName}
              maxLength={50}
              onChange={(event) => {
                if (errorMessage) {
                  setErrorMessage("")
                }
                setNewCategoryName(event.target.value)
              }}
              disabled={isBusy}
            />
          </div>
        ) : null}
        {errorMessage ? (
          <p className="text-xs text-red-600" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
        <button
          className="rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isBusy}>
          {isSaving ? "Saving..." : chrome.i18n.getMessage("save")}
        </button>
      </form>
    </main>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2">
      <h1 className="font-black text-5xl font-anton uppercase">
        {chrome.i18n.getMessage("extensionName")}
      </h1>
      <h2 className="text-lg font-medium text-slate-700 text-center">
        {chrome.i18n.getMessage("extensionDescription")}
      </h2>
    </div>
  )
}
