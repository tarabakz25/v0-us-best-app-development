import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/20 to-secondary/20">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="font-heading">メールを確認してください</CardTitle>
          <CardDescription>
            確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">ログインに戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
