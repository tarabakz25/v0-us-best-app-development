"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { SearchIcon, X } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LoadingScreen } from "@/components/loading-screen"

interface SearchResult {
  id: string
  type: "ad" | "remix" | "survey"
  title: string
  brand?: string
  imageUrl: string
  tags: string[]
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true)

      // Fetch ads, remixes, and surveys
      const [adsResult, remixesResult, surveysResult] = await Promise.all([
        supabase.from("ads").select("*").order("created_at", { ascending: false }),
        supabase.from("remixes").select("*").order("created_at", { ascending: false }),
        supabase.from("surveys").select("*").order("created_at", { ascending: false }),
      ])

      const allResults: SearchResult[] = []

      // Process ads
      if (adsResult.data) {
        adsResult.data.forEach((ad) => {
          allResults.push({
            id: ad.id,
            type: "ad",
            title: ad.title,
            brand: ad.brand || undefined,
            imageUrl: ad.media_url,
            tags: ad.brand ? [ad.brand, "広告"] : ["広告"],
          })
        })
      }

      // Process remixes
      if (remixesResult.data) {
        remixesResult.data.forEach((remix) => {
          allResults.push({
            id: remix.id,
            type: "remix",
            title: remix.title,
            imageUrl: remix.media_url,
            tags: ["Remix", "UGC"],
          })
        })
      }

      // Process surveys
      if (surveysResult.data) {
        surveysResult.data.forEach((survey) => {
          allResults.push({
            id: survey.id,
            type: "survey",
            title: survey.title,
            brand: survey.brand || undefined,
            imageUrl: survey.media_url || "/placeholder.svg?height=400&width=300",
            tags: survey.brand ? [survey.brand, "アンケート"] : ["アンケート"],
          })
        })
      }

      setResults(allResults)
      setIsLoading(false)
    }

    loadContent()
  }, [])

  const filteredResults = searchQuery
    ? results.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : results

  const handleResultClick = (item: SearchResult) => {
    router.push(`/search/${item.type}/${item.id}`)
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="商品やタグを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 w-full">
        {isLoading ? (
          <LoadingScreen className="py-24" />
        ) : (
          <div className="p-4">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "検索結果が見つかりませんでした" : "コンテンツがありません"}
              </div>
            ) : (
              <div className="columns-2 gap-4 space-y-4">
                {filteredResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleResultClick(item)}
                    className="break-inside-avoid cursor-pointer group"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-card shadow-sm transition-transform group-hover:scale-[1.02]">
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-3 space-y-1">
                        <h3 className="font-semibold text-sm text-foreground text-balance">{item.title}</h3>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav currentPage="search" />
    </div>
  )
}
