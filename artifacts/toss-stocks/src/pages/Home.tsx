import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MarketSummary } from "@/components/MarketSummary";
import { StockList } from "@/components/StockList";
import { StockModal } from "@/components/StockModal";

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <Navbar />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 space-y-8">
        <section>
          <MarketSummary />
        </section>

        <section>
          <StockList onSelectStock={setSelectedTicker} />
        </section>
      </main>

      <StockModal 
        ticker={selectedTicker} 
        onClose={() => setSelectedTicker(null)} 
      />
    </div>
  );
}
