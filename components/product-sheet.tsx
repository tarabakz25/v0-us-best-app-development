"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Star, ExternalLink, Heart, MessageCircle } from "lucide-react"

interface ProductSheetProps {
  product: {
    title: string
    description: string
    brand?: string
    mediaUrl: string
    shopUrl?: string
    reviews?: Array<{ user: string; rating: number; text: string }>
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductSheet({ product, open, onOpenChange }: ProductSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl text-balance">{product.title}</SheetTitle>
          {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto h-[calc(85vh-120px)] pb-6">
          {/* Product Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img
              src={product.mediaUrl || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">商品概要</h3>
            <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{product.description}</p>
          </div>

          <Separator />

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">口コミ</h3>
              <div className="space-y-3">
                {product.reviews.map((review, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{review.user}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Review Button */}
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                <MessageCircle className="w-4 h-4 mr-2" />
                口コミを投稿する
              </Button>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            {product.shopUrl && (
              <Button className="w-full" size="lg" asChild>
                <a href={product.shopUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  ショップで見る
                </a>
              </Button>
            )}

            <Button variant="outline" className="w-full bg-transparent" size="lg">
              <Heart className="w-4 h-4 mr-2" />
              いいね
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
