import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type SignUpPayload = {
  email?: string;
  password?: string;
  displayName?: string;
};

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase credentials:", {
      hasUrl: !!url,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return NextResponse.json(
      { error: "Supabase credentials are not configured" },
      { status: 500 },
    );
  }

  let body: SignUpPayload;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return NextResponse.json(
      { error: "無効なリクエストです" },
      { status: 400 },
    );
  }

  const email = body.email?.trim();
  const password = body.password?.trim();
  const displayName = body.displayName?.trim();

  console.log("Sign-up attempt:", {
    hasEmail: !!email,
    hasPassword: !!password,
    hasDisplayName: !!displayName,
  });

  if (!email || !password || !displayName) {
    console.error("Missing required fields:", {
      email: !!email,
      password: !!password,
      displayName: !!displayName,
    });
    return NextResponse.json(
      { error: "必須項目が入力されていません" },
      { status: 400 },
    );
  }

  // メール形式のバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "有効なメールアドレスを入力してください" },
      { status: 400 },
    );
  }

  // パスワード要件のバリデーション
  if (password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で設定してください" },
      { status: 400 },
    );
  }

  // 表示名の長さチェック
  if (displayName.length < 1 || displayName.length > 50) {
    return NextResponse.json(
      { error: "表示名は1文字以上50文字以内で入力してください" },
      { status: 400 },
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  if (error) {
    console.error("Supabase createUser error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    // エラーメッセージをサニタイズして、システム情報を漏らさない
    let sanitizedMessage = "アカウントの作成に失敗しました";

    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      sanitizedMessage = "このメールアドレスは既に登録されています";
    } else if (error.message.includes("password")) {
      sanitizedMessage = "パスワードは6文字以上で設定してください";
    } else if (error.message.includes("email")) {
      sanitizedMessage = "有効なメールアドレスを入力してください";
    }

    return NextResponse.json({ error: sanitizedMessage }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
