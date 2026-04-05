import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";
import { GameAvatar, INVEST_TYPES, type AvatarId, type InvestType } from "@/components/GameAvatar";
import { Check, ChevronRight, Phone, Lock, User, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type DifficultyType = "beginner" | "intermediate" | "expert";
type Tab = "signup" | "login";
type PhoneStep = "idle" | "sent" | "verified";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DifficultyScreenProps {
  onComplete: (userId: number) => void;
}

export default function DifficultyScreen({ onComplete }: DifficultyScreenProps) {
  const [tab, setTab] = useState<Tab>("signup");

  // ── 회원가입 상태 ──
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [selectedType, setSelectedType] = useState<InvestType>("balanced");
  const [gender, setGender] = useState<"남" | "녀" | "기타">("남");
  const [difficulty, setDifficulty] = useState<DifficultyType | null>(null);

  const [phoneStep, setPhoneStep] = useState<PhoneStep>("idle");
  const [sentCode, setSentCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  // ── 로그인 상태 ──
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const avatar: AvatarId = `${selectedType}_${gender === "녀" ? "f" : "m"}` as AvatarId;

  const difficulties: { id: DifficultyType; title: string; sub: string; seed: string; color: string; dot: string }[] = [
    { id: "beginner",     title: "입문",  sub: "여유롭게 시작",       seed: "1,000만원", color: "text-emerald-600", dot: "bg-emerald-500" },
    { id: "intermediate", title: "중급",  sub: "긴장감 있는 트레이드",  seed: "500만원",   color: "text-blue-600",    dot: "bg-blue-500"    },
    { id: "expert",       title: "고수",  sub: "실력으로 승부",        seed: "100만원",   color: "text-red-600",     dot: "bg-red-500"     },
  ];

  const selectedInvest = INVEST_TYPES.find((t) => t.type === selectedType)!;

  // 전화번호 형식 체크
  const isValidPhone = (p: string) => /^010\d{8}$/.test(p.replace(/-/g, ""));

  // 인증번호 발송
  const handleSendCode = () => {
    const normalized = phone.replace(/-/g, "");
    if (!isValidPhone(normalized)) {
      setCodeError("올바른 전화번호를 입력하세요 (010XXXXXXXX)");
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code);
    setInputCode("");
    setCodeError("");
    setPhoneStep("sent");
    window.alert(`[원광증권 인증] 인증번호: ${code}\n\n이 번호를 입력해 주세요.`);
  };

  // 인증번호 확인
  const handleVerifyCode = () => {
    if (inputCode.trim() === sentCode) {
      setPhoneStep("verified");
      setCodeError("");
    } else {
      setCodeError("인증번호가 올바르지 않습니다. 다시 확인해 주세요.");
    }
  };

  // 회원가입 제출
  const canSignup = username.trim().length > 0
    && password.length >= 4
    && password === passwordConfirm
    && phoneStep === "verified"
    && difficulty !== null;

  const handleSignup = async () => {
    if (!canSignup) return;
    setSignupLoading(true);
    setSignupError("");
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          phone: phone.replace(/-/g, ""),
          password,
          avatar,
          difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.message ?? "회원가입에 실패했습니다.");
        return;
      }
      onComplete(data.id);
    } catch {
      setSignupError("서버 연결에 실패했습니다.");
    } finally {
      setSignupLoading(false);
    }
  };

  // 로그인 제출
  const handleLogin = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginPhone.replace(/-/g, ""),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message ?? "로그인에 실패했습니다.");
        return;
      }
      onComplete(data.id);
    } catch {
      setLoginError("서버 연결에 실패했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 mx-auto flex items-center justify-center mb-5">
            <img src="/wonkwang-logo.png" alt="원광대학교 로고" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">원광증권 모의투자</h1>
          <p className="text-sm text-white/40 font-medium">계정으로 투자를 시작하세요</p>
        </div>

        {/* 탭 */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-4 gap-1">
          {([["signup", "회원가입", UserPlus], ["login", "로그인", LogIn]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                tab === key
                  ? "bg-white text-[#0f172a] shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 폼 카드 */}
        <AnimatePresence mode="wait">
          {tab === "signup" ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 닉네임 */}
              <div className="px-6 pt-6 pb-4">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">닉네임</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="사용할 닉네임 입력"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="h-px bg-border/50 mx-6" />

              {/* 전화번호 + 인증 */}
              <div className="px-6 py-4">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  전화번호 인증
                  {phoneStep === "verified" && (
                    <span className="ml-2 text-emerald-600 normal-case">✓ 인증 완료</span>
                  )}
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneStep("idle");
                        setSentCode("");
                        setInputCode("");
                        setCodeError("");
                      }}
                      placeholder="010XXXXXXXX"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:outline-none transition-all",
                        phoneStep === "verified"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-200"
                          : "border-border/60 text-foreground focus:ring-primary/20 focus:border-primary/30"
                      )}
                      maxLength={13}
                      disabled={phoneStep === "verified"}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={phoneStep === "verified" || !phone.trim()}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                      phoneStep === "verified"
                        ? "bg-emerald-100 text-emerald-600 cursor-default"
                        : "bg-[#0f172a] text-white hover:bg-[#1e293b] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                    )}
                  >
                    {phoneStep === "verified" ? "완료" : "인증번호 발송"}
                  </button>
                </div>

                {/* 인증번호 입력 */}
                <AnimatePresence>
                  {phoneStep === "sent" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6자리 인증번호 입력"
                          className="flex-1 px-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all tracking-widest"
                          maxLength={6}
                          onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                        />
                        <button
                          onClick={handleVerifyCode}
                          disabled={inputCode.length !== 6}
                          className="px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
                        >
                          확인
                        </button>
                      </div>
                      {codeError && (
                        <p className="text-xs text-red-500 font-semibold mt-1.5">{codeError}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-border/50 mx-6" />

              {/* 비밀번호 */}
              <div className="px-6 py-4">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">비밀번호</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호 (4자 이상)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 확인"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:outline-none transition-all",
                        passwordConfirm && password !== passwordConfirm
                          ? "border-red-300 focus:ring-red-200"
                          : "border-border/60 text-foreground focus:ring-primary/20 focus:border-primary/30"
                      )}
                    />
                  </div>
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="text-xs text-red-500 font-semibold">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </div>

              <div className="h-px bg-border/50 mx-6" />

              {/* 성별 선택 */}
              <div className="px-6 py-4">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">성별</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["남", "녀", "기타"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "py-2 rounded-xl text-sm font-semibold border transition-all duration-150",
                        gender === g
                          ? "bg-foreground text-background border-transparent"
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground bg-muted/30"
                      )}
                    >
                      {g === "남" ? "남성" : g === "녀" ? "여성" : "기타"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/50 mx-6" />

              {/* 투자 성향 */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">투자 성향</label>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {INVEST_TYPES.map((inv) => {
                    const isSelected = selectedType === inv.type;
                    return (
                      <button
                        key={inv.type}
                        onClick={() => setSelectedType(inv.type)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all duration-150",
                          isSelected
                            ? "border-transparent shadow-sm"
                            : "border-border/50 hover:border-border bg-muted/30 hover:bg-muted/60"
                        )}
                        style={isSelected ? { background: `${inv.themeColor}12`, borderColor: `${inv.themeColor}60` } : {}}
                      >
                        <span className="text-base leading-none">{inv.emoji}</span>
                        <span className="text-[9px] font-bold leading-none" style={isSelected ? { color: inv.themeColor } : {}}>
                          {inv.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedType}_${gender}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{ background: `${selectedInvest.themeColor}08`, borderColor: `${selectedInvest.themeColor}30` }}
                  >
                    <div className="flex-shrink-0 rounded-xl overflow-hidden">
                      <GameAvatar avatarId={avatar} size={56} rounded="rounded-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-sm text-foreground">{selectedInvest.label}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white" style={{ background: selectedInvest.themeColor }}>
                          {selectedInvest.tagline}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{selectedInvest.desc}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="h-px bg-border/50 mx-6" />

              {/* 난이도 */}
              <div className="px-6 py-4">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">난이도 · 초기 자산</label>
                <div className="space-y-1.5">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setDifficulty(diff.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left",
                        difficulty === diff.id
                          ? "border-foreground/20 bg-foreground/4"
                          : "border-border/50 hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", diff.dot)} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground mr-2">{diff.title}</span>
                        <span className="text-xs text-muted-foreground">{diff.sub}</span>
                      </div>
                      <span className={cn("text-xs font-bold flex-shrink-0", diff.color)}>{diff.seed}</span>
                      {difficulty === diff.id && <Check className="w-3.5 h-3.5 text-foreground/60 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 에러 */}
              {signupError && (
                <div className="mx-6 mb-2 px-4 py-2.5 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-semibold">{signupError}</p>
                </div>
              )}

              {/* 시작 버튼 */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleSignup}
                  disabled={!canSignup || signupLoading}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                    canSignup
                      ? "bg-[#0f172a] text-white hover:bg-[#1e293b] active:scale-[0.99] shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {signupLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>가입 중...</span>
                    </>
                  ) : (
                    <>
                      <span>투자 시작하기</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── 로그인 탭 ── */
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all"
                      maxLength={13}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="px-4 py-2.5 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm text-red-600 font-semibold">{loginError}</p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={handleLogin}
                  disabled={!loginPhone.trim() || !loginPassword.trim() || loginLoading}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                    loginPhone.trim() && loginPassword.trim()
                      ? "bg-[#0f172a] text-white hover:bg-[#1e293b] active:scale-[0.99] shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {loginLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>로그인</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                  계정이 없으신가요?{" "}
                  <button onClick={() => setTab("signup")} className="text-primary font-bold hover:underline">
                    회원가입
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
