"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const mapErrorMessage = (message: string) => {
    if (message.toLowerCase().includes("invalid login credentials")) {
      return "メールアドレスまたはパスワードが間違っています"
    }

    return message
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/home")
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(mapErrorMessage(error.message))
      } else {
        setError("エラーが発生しました")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/20 to-secondary/20">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6 mb-8">
          <img src="/logo.svg" alt="UsBest!" className="h-16" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">ログイン</CardTitle>
            <CardDescription>アカウントにログインしてください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>

              <div className="text-center text-sm mt-2">
                アカウントをお持ちでない方は{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 text-primary">
                  新規登録
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
