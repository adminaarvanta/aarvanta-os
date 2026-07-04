import { getBuddyById } from "@/lib/ageb/buddies";
import { buildProfitAndLoss } from "@/lib/finance/reports";
import { runUkPayroll } from "@/lib/payroll/run-payroll";
import { analyzeContractText } from "@/lib/legal/analyze";
import type { EngineDispatchResult, FabricTaskResult } from "@/lib/fabric/types";
import type { TenantScope } from "@/types/communication";

export type { EngineDispatchResult, FabricTaskResult };

export async function dispatchBuddyToEngine(input: {
  scope: TenantScope;
  buddyId: string;
  task: string;
}): Promise<EngineDispatchResult> {
  const buddy = getBuddyById(input.buddyId);
  const domain = buddy?.domain ?? "general";

  switch (domain) {
    case "accounting": {
      const pl = await buildProfitAndLoss(input.scope);
      return {
        engine: "finance",
        executed: true,
        output: {
          netProfit: pl.netProfit,
          revenue: pl.revenue,
          message: `P&L generated. Net profit: £${pl.netProfit.toFixed(2)}`,
        },
      };
    }
    case "payroll": {
      try {
        const result = await runUkPayroll(input.scope);
        return {
          engine: "payroll",
          executed: true,
          output: {
            payRunId: result.payRun.id,
            employeeCount: result.payRun.employeeCount,
            grossTotal: result.payRun.grossTotal,
          },
        };
      } catch (error) {
        return {
          engine: "payroll",
          executed: false,
          output: {
            message: error instanceof Error ? error.message : "Payroll failed",
          },
        };
      }
    }
    case "legal": {
      const analysis = analyzeContractText(input.task);
      return {
        engine: "legal",
        executed: true,
        output: {
          riskScore: analysis.riskScore,
          riskSummary: analysis.riskSummary,
          clauseCount: analysis.clauses.length,
        },
      };
    }
    default:
      return { engine: domain, executed: false };
  }
}

export function mergeFabricWithEngine(
  fabric: FabricTaskResult,
  engine: EngineDispatchResult
): FabricTaskResult & { engine: EngineDispatchResult } {
  if (engine.executed && engine.output) {
    return {
      ...fabric,
      engine,
      recommendation: `${fabric.recommendation} Engine output: ${JSON.stringify(engine.output)}`,
      suggestedActions: [
        ...fabric.suggestedActions,
        ...(engine.output.message ? [String(engine.output.message)] : []),
      ],
    };
  }
  return { ...fabric, engine };
}
