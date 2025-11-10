import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type SignUpPayload = {
  email?: string
  password?: string
  displayName?: string
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase credentials are not configured" }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as SignUpPayload
  const email = body.email?.trim()
  const password = body.password?.trim()
  const displayName = body.displayName?.trim()

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 })
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
