"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { SearchIcon, X } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"

const mockResults = [
  {
    id: "1",
    title: "ワイヤレスイヤホン",
    brand: "TechSound",
    imageUrl: "/wireless-earbuds.png",
    tags: ["テック", "オーディオ"],
  },
  {
    id: "2",
    title: "エコ水筒",
    brand: "GreenLife",
    imageUrl: "/eco-water-bottle.jpg",
    tags: ["エコ", "ライフスタイル"],
  },
  {
    id: "3",
    title: "スマートウォッチ",
    brand: "FitTech",
    imageUrl: "/smartwatch-lifestyle.png",
    tags: ["テック", "フィットネス"],
  },
  {
    id: "4",
    title: "オーガニック化粧品",
    brand: "NaturalBeauty",
    imageUrl: "/organic-cosmetics.jpg",
    tags: ["美容", "オーガニック"],
  },
  {
    id: "5",
    title: "ポータブルスピーカー",
    brand: "SoundWave",
    imageUrl: "/portable-speaker.png",
    tags: ["テック", "オーディオ"],
  },
  {
    id: "6",
    title: "ヨガマット",
    brand: "ZenFit",
    imageUrl: "/rolled-yoga-mat.png",
    tags: ["フィットネス", "ウェルネス"],
  },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredResults = searchQuery
    ? mockResults.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : mockResults

  return (
    <div className="min-h-screen bg-background pb-20">
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

      {/* Results Grid - Pinterest style */}
      <div className="p-4">
        <div className="columns-2 gap-4 space-y-4">
          {filteredResults.map((item) => (
            <div key={item.id} onClick={() => router.push("/home")} className="break-inside-avoid cursor-pointer group">
              <div className="relative overflow-hidden rounded-xl bg-card shadow-sm transition-transform group-hover:scale-[1.02]">
                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm text-foreground text-balance">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.brand}</p>
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
      </div>

      <BottomNav currentPage="search" />
    </div>
  )
}
