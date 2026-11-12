import type { ContractType } from "@/types/database";
import { painCopy, salaryGaugeRange } from "@/lib/premium/painCopy";
import { SalaryGauge } from "@/components/premium/SalaryGauge";

// Bloc du paywall (12/11, Nathan) : « c'est bientôt fini » et « c'est un
// investissement, tu auras un salaire ». Faits vrais seulement, voir
// lib/premium/painCopy.ts.
export function PaywallPain({
  lookingFor,
  premiumMonthly,
  autoMonthly,
}: {
  lookingFor: ContractType[] | null | undefined;
  premiumMonthly: number;
  autoMonthly: number | null;
}) {
  const copy = painCopy(lookingFor);
  const range = salaryGaugeRange(lookingFor);
  return (
    <div className="flex flex-col gap-2 animate-in" style={{ marginTop: 14 }}>
      <div className="flex gap-2.5" style={{ background: "#fdeee6", borderRadius: 14, padding: "10px 12px" }}>
        <span aria-hidden style={{ fontSize: 17, lineHeight: 1.3 }}>
          ⏳
        </span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
          {copy.deadline} {copy.pain}
        </p>
      </div>
      <SalaryGauge min={range.min} legalMin={range.legalMin} start={range.start} premiumMonthly={premiumMonthly} autoMonthly={autoMonthly} />
    </div>
  );
}
