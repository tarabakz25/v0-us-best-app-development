"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

// URL検証ヘルパー関数
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function PostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"ad" | "survey">("ad");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Ad state
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [brandName, setBrandName] = useState("");
  const [shopUrl, setShopUrl] = useState("");
  const [adMedia, setAdMedia] = useState<File | null>(null);
  const [adMediaPreview, setAdMediaPreview] = useState<string>("");

  // Survey state
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyBrand, setSurveyBrand] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState<
    Array<{ id: string; question: string; options: string[] }>
  >([{ id: "1", question: "", options: ["", ""] }]);
  const [surveyMedia, setSurveyMedia] = useState<File | null>(null);
  const [surveyMediaPreview, setSurveyMediaPreview] = useState<string>("");

  const handleAdMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSurveyMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSurveyMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSurveyMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSurveyQuestion = () => {
    setSurveyQuestions([
      ...surveyQuestions,
      { id: Date.now().toString(), question: "", options: ["", ""] },
    ]);
  };

  const removeSurveyQuestion = (id: string) => {
    setSurveyQuestions(surveyQuestions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, question: string) => {
    setSurveyQuestions(
      surveyQuestions.map((q) => (q.id === id ? { ...q, question } : q)),
    );
  };

  const addOption = (questionId: string) => {
    setSurveyQuestions(
      surveyQuestions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setSurveyQuestions(
      surveyQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setSurveyQuestions(
      surveyQuestions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q,
      ),
    );
  };

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      } else {
        setUserId(user.id);
      }
    }
    checkAuth();
  }, []);

  // Implement ad submission to Supabase
  const handleSubmitAd = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      return;
    }

    // 入力バリデーション
    if (!adTitle.trim() || adTitle.length > 200) {
      toast({
        title: "エラー",
        description: "タイトルは1文字以上200文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!adDescription.trim() || adDescription.length > 1000) {
      toast({
        title: "エラー",
        description: "説明は1文字以上1000文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (shopUrl && !isValidUrl(shopUrl)) {
      toast({
        title: "エラー",
        description: "有効なURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media to Supabase Storage
      let mediaUrl = "";
      if (adMedia) {
        const fileExt = adMedia.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, adMedia);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      // Insert ad into database
      const { error: insertError } = await supabase.from("ads").insert({
        user_id: userId,
        title: adTitle,
        description: adDescription,
        brand: brandName,
        media_url: mediaUrl,
        shop_url: shopUrl,
      });

      if (insertError) throw insertError;

      toast({
        title: "成功",
        description: "広告を投稿しました",
      });

      // Reset form
      setAdTitle("");
      setAdDescription("");
      setBrandName("");
      setShopUrl("");
      setAdMedia(null);
      setAdMediaPreview("");

      // Navigate to home
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error) {
      console.error("[v0] Error submitting ad:", error);
      toast({
        title: "エラー",
        description: "広告の投稿に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Implement survey submission to Supabase
  const handleSubmitSurvey = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      return;
    }

    // 入力バリデーション
    if (!surveyTitle.trim() || surveyTitle.length > 200) {
      toast({
        title: "エラー",
        description: "タイトルは1文字以上200文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!surveyDescription.trim() || surveyDescription.length > 1000) {
      toast({
        title: "エラー",
        description: "説明は1文字以上1000文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (surveyQuestions.length === 0) {
      toast({
        title: "エラー",
        description: "質問を少なくとも1つ追加してください",
        variant: "destructive",
      });
      return;
    }

    // 各質問のバリデーション
    for (let i = 0; i < surveyQuestions.length; i++) {
      const question = surveyQuestions[i];
      if (!question.question.trim()) {
        toast({
          title: "エラー",
          description: `質問 ${i + 1} を入力してください`,
          variant: "destructive",
        });
        return;
      }
      if (question.question.length > 500) {
        toast({
          title: "エラー",
          description: `質問 ${i + 1} は500文字以内で入力してください`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload media to Supabase Storage
      let mediaUrl = "";
      if (surveyMedia) {
        const fileExt = surveyMedia.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, surveyMedia);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      // Format questions for database
      const formattedQuestions = surveyQuestions.map((q) => ({
        question: q.question,
        options: q.options.filter((opt) => opt.trim() !== ""),
      }));

      // Insert survey into database
      const { error: insertError } = await supabase.from("surveys").insert({
        user_id: userId,
        title: surveyTitle,
        description: surveyDescription,
        brand: surveyBrand || null,
        media_url: mediaUrl || null,
        questions: formattedQuestions,
      });

      if (insertError) throw insertError;

      toast({
        title: "成功",
        description: "アンケートを投稿しました",
      });

      // Reset form
      setSurveyTitle("");
      setSurveyDescription("");
      setSurveyBrand("");
      setSurveyQuestions([{ id: "1", question: "", options: ["", ""] }]);
      setSurveyMedia(null);
      setSurveyMediaPreview("");

      // Navigate to home
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error) {
      console.error("[v0] Error submitting survey:", error);
      toast({
        title: "エラー",
        description: "アンケートの投稿に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg">投稿</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "ad" | "survey")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ad">広告</TabsTrigger>
            <TabsTrigger value="survey">アンケート</TabsTrigger>
          </TabsList>

          {/* Ad Form */}
          <TabsContent value="ad">
            <form onSubmit={handleSubmitAd} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>広告を作成</CardTitle>
                  <CardDescription>
                    商品やサービスの魅力を伝える広告を作成しましょう
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Media Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="ad-media">メディア（画像/動画）*</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        id="ad-media"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleAdMediaChange}
                        className="hidden"
                        required
                      />
                      <label htmlFor="ad-media" className="cursor-pointer">
                        {adMediaPreview ? (
                          <img
                            src={adMediaPreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              クリックしてアップロード
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-name">ブランド名*</Label>
                    <Input
                      id="brand-name"
                      placeholder="例: TechSound"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad-title">タイトル*</Label>
                    <Input
                      id="ad-title"
                      placeholder="例: 新しいワイヤレスイヤホン"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad-description">説明*</Label>
                    <Textarea
                      id="ad-description"
                      placeholder="商品の特徴や魅力を説明してください"
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shop-url">ショップURL*</Label>
                    <Input
                      id="shop-url"
                      type="url"
                      placeholder="https://example.com/product"
                      value={shopUrl}
                      onChange={(e) => setShopUrl(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "投稿中..." : "広告を投稿"}
              </Button>
            </form>
          </TabsContent>

          {/* Survey Form */}
          <TabsContent value="survey">
            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>アンケートを作成</CardTitle>
                  <CardDescription>
                    ユーザーの意見を集めてより良い商品を作りましょう
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Media Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="survey-media">カバー画像</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        id="survey-media"
                        type="file"
                        accept="image/*"
                        onChange={handleSurveyMediaChange}
                        className="hidden"
                      />
                      <label htmlFor="survey-media" className="cursor-pointer">
                        {surveyMediaPreview ? (
                          <img
                            src={surveyMediaPreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              クリックしてアップロード（任意）
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="survey-brand">ブランド名</Label>
                    <Input
                      id="survey-brand"
                      placeholder="例: AppDev Co."
                      value={surveyBrand}
                      onChange={(e) => setSurveyBrand(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="survey-title">タイトル*</Label>
                    <Input
                      id="survey-title"
                      placeholder="例: 次の機能は？"
                      value={surveyTitle}
                      onChange={(e) => setSurveyTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="survey-description">説明*</Label>
                    <Textarea
                      id="survey-description"
                      placeholder="アンケートの目的や内容を説明してください"
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">質問</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSurveyQuestion}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    質問を追加
                  </Button>
                </div>

                {surveyQuestions.map((question, qIndex) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          質問 {qIndex + 1}
                        </CardTitle>
                        {surveyQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSurveyQuestion(question.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`question-${question.id}`}>
                          質問文*
                        </Label>
                        <Input
                          id={`question-${question.id}`}
                          placeholder="質問を入力してください"
                          value={question.question}
                          onChange={(e) =>
                            updateQuestion(question.id, e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>選択肢</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(question.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            選択肢を追加
                          </Button>
                        </div>
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className="flex items-center gap-2"
                          >
                            <Input
                              placeholder={`選択肢 ${optIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  question.id,
                                  optIndex,
                                  e.target.value,
                                )
                              }
                              required
                            />
                            {question.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeOption(question.id, optIndex)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "投稿中..." : "アンケートを投稿"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav currentPage="home" />
    </div>
  );
}
