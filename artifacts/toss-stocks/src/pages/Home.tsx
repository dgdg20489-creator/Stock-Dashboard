import { MarketSummary } from "@/components/MarketSummary";
import { StockList } from "@/components/StockList";

export default function Home() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section>
        <MarketSummary />
      </section>

      <section>
        <StockList />
      </section>
    </div>
  );
}
