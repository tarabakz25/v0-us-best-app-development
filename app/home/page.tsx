"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { ProductSheet } from "@/components/product-sheet"
import { BottomNav } from "@/components/bottom-nav"

interface ContentItem {
  id: string
  type: "ad" | "remix" | "survey"
  title: string
  description: string
  brand?: string
  mediaUrl: string
  likes: number
  comments: number
  shopUrl?: string
  reviews?: Array<{ user: string; rating: number; text: string }>
}

const mockContent: ContentItem[] = [
  {
    id: "1",
    type: "ad",
    title: "新しいワイヤレスイヤホン",
    description: "最新のノイズキャンセリング技術搭載。音楽をもっと自由に。",
    brand: "TechSound",
    mediaUrl: "/wireless-earbuds-product-photo.png",
    likes: 1234,
    comments: 89,
    shopUrl: "https://example.com",
    reviews: [
      { user: "ユーザーA", rating: 5, text: "音質が素晴らしい！" },
      { user: "ユーザーB", rating: 4, text: "デザインがおしゃれ" },
    ],
  },
  {
    id: "2",
    type: "remix",
    title: "ユーザーのリミックス動画",
    description: "実際に使ってみた感想をシェア",
    mediaUrl: "/person-using-product.jpg",
    likes: 567,
    comments: 34,
  },
  {
    id: "3",
    type: "survey",
    title: "アンケート: 次の機能は？",
    description: "新機能について教えてください",
    brand: "AppDev Co.",
    mediaUrl: "/survey-questionnaire-illustration.jpg",
    likes: 890,
    comments: 45,
  },
  {
    id: "4",
    type: "ad",
    title: "エコフレンドリーな水筒",
    description: "地球に優しい、あなたに優しい",
    brand: "GreenLife",
    mediaUrl: "/eco-friendly-water-bottle.jpg",
    likes: 2341,
    comments: 156,
    shopUrl: "https://example.com",
    reviews: [{ user: "ユーザーC", rating: 5, text: "保温性能が抜群" }],
  },
]

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<ContentItem | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrolling.current) return

      const scrollTop = container.scrollTop
      const itemHeight = container.clientHeight
      const newIndex = Math.round(scrollTop / itemHeight)

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < mockContent.length) {
        setCurrentIndex(newIndex)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [currentIndex])

  const handleProductClick = (item: ContentItem) => {
    if (item.type === "ad") {
      setSelectedProduct(item)
    }
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {mockContent.map((item, index) => (
          <div key={item.id} className="h-screen w-full snap-start relative flex items-center justify-center">
            <img
              src={item.mediaUrl || "/placeholder.svg"}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* Content Overlay */}
            <div className="absolute bottom-24 left-0 right-0 px-6 text-white space-y-3">
              {item.brand && <div className="text-sm font-medium opacity-90">{item.brand}</div>}
              <h2 className="text-2xl font-bold text-balance">{item.title}</h2>
              <p className="text-sm opacity-90 text-pretty">{item.description}</p>

              {item.type === "ad" && (
                <Button
                  onClick={() => handleProductClick(item)}
                  className="bg-white text-foreground hover:bg-white/90 mt-4"
                >
                  詳細を見る
                </Button>
              )}

              {item.type === "survey" && (
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
                  アンケートに答える
                </Button>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6">
              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{item.likes}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{item.comments}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav currentPage="home" />

      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
