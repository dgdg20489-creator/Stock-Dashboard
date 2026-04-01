import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

/* ─────────────────────────────────────────────
   익명 닉네임 생성 (한국어 동물 + 형용사)
───────────────────────────────────────────── */
const ADJ = [
  "급등하는","하락하는","용감한","지혜로운","달리는","겁없는","현명한","눈치빠른",
  "느긋한","상한가","하한가","매수하는","존버하는","흔들리지않는","냉철한","열정적인",
];
const ANIMALS = [
  "사자","독수리","여우","호랑이","곰","늑대","부엉이","매","고슴도치","판다",
  "하이에나","재규어","치타","코브라","악어",
];
function generateNickname(seed: number): string {
  const a = ADJ[seed % ADJ.length];
  const b = ANIMALS[Math.floor(seed / ADJ.length) % ANIMALS.length];
  return `${a} ${b}`;
}

/* ─────────────────────────────────────────────
   GET /api/community/:ticker/comments
   → 댓글 목록 (최신순, 최대 100개) + 반응 집계
───────────────────────────────────────────── */
router.get("/community/:ticker/comments", async (req, res) => {
  try {
    const { ticker } = req.params;
    const userId = Number(req.query.userId) || 0;

    const result = await pool.query(
      `SELECT
         c.id, c.user_id, c.ticker, c.content, c.nickname,
         c.is_shareholder, c.created_at,
         COALESCE(
           json_object_agg(cr.reaction, cr.cnt) FILTER (WHERE cr.reaction IS NOT NULL),
           '{}'::json
         ) AS reactions,
         COALESCE(
           json_agg(my.reaction) FILTER (WHERE my.reaction IS NOT NULL),
           '[]'::json
         ) AS my_reactions
       FROM comments c
       LEFT JOIN (
         SELECT comment_id, reaction, COUNT(*) AS cnt
         FROM comment_reactions
         GROUP BY comment_id, reaction
       ) cr ON cr.comment_id = c.id
       LEFT JOIN (
         SELECT comment_id, reaction
         FROM comment_reactions
         WHERE user_id = $2
       ) my ON my.comment_id = c.id
       WHERE c.ticker = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT 100`,
      [ticker, userId]
    );

    res.json(result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      ticker: r.ticker,
      content: r.content,
      nickname: r.nickname,
      isShareholder: r.is_shareholder,
      createdAt: r.created_at,
      reactions: r.reactions || {},
      myReactions: r.my_reactions || [],
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ─────────────────────────────────────────────
   POST /api/community/:ticker/comments
   Body: { userId, content }
   → 댓글 작성 (주주 여부 자동 판별)
───────────────────────────────────────────── */
router.post("/community/:ticker/comments", async (req, res) => {
  try {
    const { ticker } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content?.trim()) {
      return res.status(400).json({ error: "userId와 content가 필요합니다" });
    }
    if (content.trim().length > 300) {
      return res.status(400).json({ error: "댓글은 300자 이하로 작성해주세요" });
    }

    // 주주 여부 확인
    const holdingRes = await pool.query(
      `SELECT 1 FROM holdings WHERE user_id = $1 AND ticker = $2 AND CAST(shares AS NUMERIC) > 0 LIMIT 1`,
      [userId, ticker]
    );
    const isShareholder = holdingRes.rows.length > 0;

    // 닉네임 생성 (user_id 기반 결정론적)
    const nickSeed = (userId * 37 + ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % (ADJ.length * ANIMALS.length);
    const nickname = generateNickname(nickSeed);

    const result = await pool.query(
      `INSERT INTO comments (user_id, ticker, content, nickname, is_shareholder)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, ticker, content, nickname, is_shareholder, created_at`,
      [userId, ticker, content.trim(), nickname, isShareholder]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      userId: row.user_id,
      ticker: row.ticker,
      content: row.content,
      nickname: row.nickname,
      isShareholder: row.is_shareholder,
      createdAt: row.created_at,
      reactions: {},
      myReactions: [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ─────────────────────────────────────────────
   POST /api/community/reactions
   Body: { userId, commentId, reaction }
   → 반응 토글 (있으면 삭제, 없으면 추가)
───────────────────────────────────────────── */
router.post("/community/reactions", async (req, res) => {
  try {
    const { userId, commentId, reaction } = req.body;
    const VALID = ["👍", "🔥", "😭"];
    if (!userId || !commentId || !VALID.includes(reaction)) {
      return res.status(400).json({ error: "유효하지 않은 요청" });
    }

    const existing = await pool.query(
      `SELECT id FROM comment_reactions WHERE comment_id=$1 AND user_id=$2 AND reaction=$3`,
      [commentId, userId, reaction]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM comment_reactions WHERE comment_id=$1 AND user_id=$2 AND reaction=$3`,
        [commentId, userId, reaction]
      );
      res.json({ toggled: false });
    } else {
      await pool.query(
        `INSERT INTO comment_reactions (comment_id, user_id, reaction) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [commentId, userId, reaction]
      );
      res.json({ toggled: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ─────────────────────────────────────────────
   GET /api/community/:ticker/viewers
   → 현재 접속자 수 (결정론적 + 소폭 랜덤)
───────────────────────────────────────────── */
router.get("/community/:ticker/viewers", async (req, res) => {
  try {
    const { ticker } = req.params;
    const base = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 200;
    const wave = Math.floor(Math.sin(Date.now() / 30000) * 20 + 20);
    const viewers = 50 + base + wave;
    res.json({ viewers });
  } catch (e) {
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;
