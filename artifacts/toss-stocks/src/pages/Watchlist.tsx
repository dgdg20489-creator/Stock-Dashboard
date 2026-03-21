import { useState } from "react";
import { useGetStocks } from "@workspace/api-client-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { formatCurrency, formatPercent, getColorClass, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Star, FolderPlus, Pencil, Trash2, ChevronDown, ChevronRight, Plus, Check, X } from "lucide-react";

export default function Watchlist() {
  const { data: stocks } = useGetStocks();
  const { groups, removeFromGroup, createGroup, renameGroup, deleteGroup } = useWatchlist();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["default"]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const confirmEdit = () => {
    if (editingId && editName.trim()) {
      renameGroup(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newGroupName.trim()) return;
    const id = createGroup(newGroupName.trim());
    setOpenGroups((prev) => new Set([...prev, id]));
    setNewGroupName("");
    setShowNewGroup(false);
  };

  const totalWatched = groups.reduce((acc, g) => acc + g.stocks.length, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">관심 종목</h1>
          <p className="text-muted-foreground font-medium mt-1">총 {totalWatched}개 종목 관심 등록</p>
        </div>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl font-bold text-sm hover:bg-primary/20 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          그룹 추가
        </button>
      </div>

      {/* 새 그룹 생성 */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card rounded-2xl p-4 border border-primary/20 shadow-sm flex gap-3"
          >
            <input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="그룹 이름 입력..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm placeholder:text-muted-foreground/60 border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={handleCreate} className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setShowNewGroup(false)} className="p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 그룹 목록 */}
      <div className="space-y-4">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.id);
          const groupStocks = (stocks || []).filter((s) => group.stocks.includes(s.ticker));

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
            >
              {/* 그룹 헤더 */}
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {editingId === group.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-3 py-1 rounded-lg bg-muted text-foreground font-bold text-base border-none outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <span className="font-bold text-foreground truncate">{group.name}</span>
                  )}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                    {group.stocks.length}
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  {editingId === group.id ? (
                    <button onClick={confirmEdit} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </button>
                  ) : (
                    <button onClick={() => startEdit(group.id, group.name)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {group.id !== "default" && (
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* 그룹 내 종목 */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40">
                      {groupStocks.length === 0 ? (
                        <div className="px-5 py-8 text-center text-muted-foreground text-sm font-semibold">
                          <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>관심 종목이 없습니다.</p>
                          <Link href="/" className="mt-1 inline-block text-primary font-bold hover:underline text-xs">
                            주식 목록에서 ★ 눌러 추가
                          </Link>
                        </div>
                      ) : (
                        groupStocks.map((stock) => (
                          <div key={stock.ticker} className="flex items-center px-5 py-3.5 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0">
                            <Link href={`/stock/${stock.ticker}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-inner flex-shrink-0">
                                {stock.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground text-sm truncate">{stock.name}</p>
                                <p className="text-xs text-muted-foreground font-medium">{stock.ticker}</p>
                              </div>
                            </Link>
                            <div className="text-right mr-3">
                              <p className="font-extrabold text-sm text-foreground">{formatCurrency(stock.currentPrice)}</p>
                              <p className={cn("text-xs font-bold", getColorClass(stock.changePercent))}>
                                {stock.changePercent > 0 ? "+" : ""}{formatPercent(stock.changePercent)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromGroup(stock.ticker, group.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-lg">관심 그룹을 만들어 보세요</p>
          <p className="text-sm mt-1">위 버튼을 눌러 그룹을 생성하세요.</p>
        </div>
      )}
    </div>
  );
}
