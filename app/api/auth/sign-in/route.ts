import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SignInPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: SignInPayload;

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

  console.log("Sign-in attempt:", {
    hasEmail: !!email,
    hasPassword: !!password
  });

  if (!email || !password) {
    console.error("Missing required fields:", { email: !!email, password: !!password });
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください" },
      { status: 400 },
    );
  }

  // メール形式の簡易バリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "有効なメールアドレスを入力してください" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signIn error:", {
        message: error.message,
        status: error.status,
      });

      // エラーメッセージをサニタイズ
      let sanitizedMessage = "ログインに失敗しました";

      if (error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid") ||
          error.message.includes("incorrect")) {
        sanitizedMessage = "メールアドレスまたはパスワードが間違っています";
      } else if (error.message.includes("Email not confirmed")) {
        sanitizedMessage = "メールアドレスの確認が完了していません";
      } else if (error.message.includes("too many requests")) {
        sanitizedMessage = "ログイン試行回数が多すぎます。しばらく待ってから再度お試しください";
      }

      return NextResponse.json({ error: sanitizedMessage }, { status: 401 });
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "認証情報の取得に失敗しました" },
        { status: 401 },
      );
    }

    console.log("Sign-in successful:", { userId: data.user.id });

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Unexpected error during sign-in:", error);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました" },
      { status: 500 },
    );
  }
}
