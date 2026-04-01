import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Users, Send, RefreshCw } from "lucide-react";

interface Comment {
  id: number;
  userId: number;
  ticker: string;
  content: string;
  nickname: string;
  isShareholder: boolean;
  createdAt: string;
  reactions: Record<string, number>;
  myReactions: string[];
}

interface CommunitySectionProps {
  ticker: string;
  userId: number;
}

const REACTIONS = [
  { emoji: "👍", label: "좋아요" },
  { emoji: "🔥", label: "가즈아" },
  { emoji: "😭", label: "살려줘" },
];

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE_URL.replace("/toss-stocks", "")}/api`.replace("//api", "/api");

export function CommunitySection({ ticker, userId }: CommunitySectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [viewers, setViewers] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const r = await fetch(`/api/community/${ticker}/comments?userId=${userId}`);
      if (!r.ok) return;
      const data = await r.json();
      setComments(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [ticker, userId]);

  const fetchViewers = useCallback(async () => {
    try {
      const r = await fetch(`/api/community/${ticker}/viewers`);
      if (!r.ok) return;
      const d = await r.json();
      setViewers(d.viewers);
    } catch {
      /* ignore */
    }
  }, [ticker]);

  useEffect(() => {
    fetchComments();
    fetchViewers();
    const commentTimer = setInterval(fetchComments, 10000);
    const viewerTimer = setInterval(fetchViewers, 15000);
    return () => {
      clearInterval(commentTimer);
      clearInterval(viewerTimer);
    };
  }, [fetchComments, fetchViewers]);

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`/api/community/${ticker}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: content.trim() }),
      });
      if (!r.ok) {
        const err = await r.json();
        alert(err.error || "댓글 작성 실패");
        return;
      }
      const newComment = await r.json();
      setComments((prev) => [newComment, ...prev]);
      setContent("");
      inputRef.current?.focus();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (commentId: number, reaction: string) => {
    try {
      const r = await fetch(`/api/community/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, commentId, reaction }),
      });
      if (!r.ok) return;
      const { toggled } = await r.json();

      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const newReactions = { ...c.reactions };
          const newMyReactions = [...c.myReactions];
          if (toggled) {
            newReactions[reaction] = (newReactions[reaction] || 0) + 1;
            newMyReactions.push(reaction);
          } else {
            newReactions[reaction] = Math.max((newReactions[reaction] || 1) - 1, 0);
            if (newReactions[reaction] === 0) delete newReactions[reaction];
            const idx = newMyReactions.indexOf(reaction);
            if (idx !== -1) newMyReactions.splice(idx, 1);
          }
          return { ...c, reactions: newReactions, myReactions: newMyReactions };
        })
      );
    } catch {
      /* ignore */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-foreground">커뮤니티</span>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {comments.length}개
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 실시간 접속자 수 */}
          {viewers > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              <Users className="w-3.5 h-3.5" />
              <span className="text-green-600 font-bold">{viewers}명</span>이 보는 중
            </div>
          )}
          <button
            onClick={fetchComments}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div
        ref={listRef}
        className="overflow-y-auto max-h-[460px] divide-y divide-border/40"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm font-semibold">첫 번째 댓글을 남겨보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReact={handleReaction}
            />
          ))
        )}
      </div>

      {/* 입력 바 */}
      <div className="border-t border-border/50 px-4 py-3 bg-muted/30">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl px-4 py-3 text-sm font-medium",
              "bg-background border border-border/60 text-foreground",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "transition-all max-h-28 overflow-y-auto leading-relaxed"
            )}
            style={{ minHeight: "44px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 112) + "px";
            }}
            maxLength={300}
          />
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
              "bg-primary text-white font-bold transition-all",
              "hover:scale-105 active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            )}
          >
            {posting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[10px] text-muted-foreground">
            이름은 자동으로 익명 닉네임이 부여됩니다
          </p>
          <p className="text-[10px] text-muted-foreground">{content.length}/300</p>
        </div>
      </div>
    </div>
  );
}

/* ─── 개별 댓글 카드 ─── */
function CommentItem({
  comment,
  onReact,
}: {
  comment: Comment;
  onReact: (id: number, reaction: string) => void;
}) {
  return (
    <div className="px-5 py-4 hover:bg-muted/20 transition-colors">
      {/* 닉네임 + 배지 + 시간 */}
      <div className="flex items-center gap-2 mb-2">
        {/* 아바타 */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-extrabold text-primary">
            {comment.nickname.split(" ")[1]?.[0] || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-foreground truncate">
              {comment.nickname}
            </span>
            {comment.isShareholder ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                💎 주주
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full flex-shrink-0">
                👤 일반
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 댓글 내용 */}
      <p className="text-sm text-foreground leading-relaxed pl-10 break-words whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* 이모지 반응 */}
      <div className="flex items-center gap-2 mt-2.5 pl-10">
        {REACTIONS.map(({ emoji, label }) => {
          const count = comment.reactions[emoji] || 0;
          const reacted = comment.myReactions.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => onReact(comment.id, emoji)}
              title={label}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all",
                "hover:scale-110 active:scale-95",
                reacted
                  ? "bg-primary/10 border border-primary/30 text-primary"
                  : "bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span className={reacted ? "text-primary" : "text-muted-foreground"}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
