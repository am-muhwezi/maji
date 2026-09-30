/**
 * Sample data, anchored to `today` so the app always looks like a live working day.
 * Everything is placed by offset (days before today) and nothing is clamped, so every
 * date window (this month, last month, last 30 days) sees a realistic, continuous
 * business. This matters on the 1st of a month: an earlier seed clamped a whole month
 * of costs onto that one day.
 */
import { addDays } from "./format";
import type { Expense, HistoryDay, Material, OpsState, ProductId, Sale, StockLine } from "./types";

/** Days of itemless sales history kept before today. */
export const HISTORY_DAYS = 60;

export function seed(today: string): OpsState {
  const materials: Material[] = [
    { id: "e20", name: "20L empty shells", kind: "empties", onHand: 1_120, unit: "shells", reorderAt: 300, capacity: 2_000 },
    { id: "e19", name: "18.9L empty shells", kind: "empties", onHand: 170, unit: "shells", reorderAt: 150, capacity: 600 },
    { id: "cap", name: "Caps & seals", kind: "packaging", onHand: 14_200, unit: "pcs", reorderAt: 5_000, capacity: 30_000 },
    { id: "wrap", name: "Shrink wrap", kind: "packaging", onHand: 42, unit: "rolls", reorderAt: 50, capacity: 120 },
    { id: "lbl", name: "Labels", kind: "packaging", onHand: 6_800, unit: "pcs", reorderAt: 2_000, capacity: 15_000 },
    { id: "pet", name: "PET preforms", kind: "raw", onHand: 8_500, unit: "pcs", reorderAt: 3_000, capacity: 20_000 },
  ];

  const t = (time: string, rest: Omit<Sale, "id" | "receipt" | "day" | "time">, n: number): Sale => ({
    id: `s${n}`,
    receipt: `SL-${n}`,
    day: today,
    time,
    ...rest,
  });

  const sales: Sale[] = [
    // Older unpaid credit, drives the receivables views.
    { id: "s1041", receipt: "SL-1041", day: addDays(today, -64), time: "10:30", customer: "Hotel Africana", customerNote: "Banquet dept.", productId: "d19", kind: "refill", qty: 24, amount: 120_000, payment: "credit", dueDay: addDays(today, -34) },
    { id: "s1063", receipt: "SL-1063", day: addDays(today, -23), time: "09:10", customer: "Speke Resort", customerNote: "Weekly refill cycle", productId: "b20", kind: "refill", qty: 104, amount: 520_000, payment: "credit", dueDay: addDays(today, 7) },
    { id: "s1070", receipt: "SL-1070", day: addDays(today, -18), time: "15:40", customer: "Kampala Serena", customerNote: "Spa & banquet", productId: "d19", kind: "refill", qty: 46, amount: 230_000, payment: "credit", dueDay: addDays(today, 12) },
    { id: "s1079", receipt: "SL-1079", day: addDays(today, -4), time: "11:20", customer: "Latitude 0 Degrees", customerNote: "Dispenser contract", productId: "d19", kind: "refill", qty: 76, amount: 380_000, payment: "credit", dueDay: addDays(today, 26) },
    // Today, receipts numbered in time order.
    t("08:40", { customer: "Walk-in", customerNote: "Mr. Kato", productId: "b20", kind: "new", qty: 2, amount: 70_000, payment: "cash" }, 1080),
    t("09:18", { customer: "Apex Gyms", customerNote: "Kololo branch", productId: "b10", kind: "refill", qty: 18, amount: 63_000, payment: "airtel" }, 1081),
    t("10:02", { customer: "Route 2 delivery", customerNote: "Truck UBG-112", productId: "p5", kind: "refill", qty: 50, amount: 650_000, payment: "cash" }, 1082),
    t("10:18", { customer: "Agaba Wholesale", productId: "b20", kind: "refill", qty: 100, amount: 500_000, payment: "cash" }, 1083),
    t("11:05", { customer: "Mukono Residences", productId: "b20", kind: "refill", qty: 40, amount: 200_000, payment: "airtel" }, 1084),
    t("11:15", { customer: "Kampala Medical Centre", customerNote: "Receiving dept.", productId: "b20", kind: "new", qty: 20, amount: 700_000, payment: "mtn" }, 1085),
    t("12:15", { customer: "Hotel Africana", productId: "d19", kind: "refill", qty: 20, amount: 100_000, payment: "credit", dueDay: addDays(today, 30) }, 1086),
    t("12:40", { customer: "Nakawa Market stall", productId: "j20", kind: "refill", qty: 60, amount: 270_000, payment: "cash" }, 1087),
    t("13:45", { customer: "Lake Victoria Hotel", customerNote: "Entebbe route", productId: "d19", kind: "exchange", qty: 25, amount: 150_000, payment: "credit", dueDay: addDays(today, 14) }, 1088),
    t("13:50", { customer: "Dr. Ronald Senkaali", productId: "b20", kind: "new", qty: 4, amount: 140_000, payment: "mtn" }, 1089),
    t("14:22", { customer: "Kireka Supermarket", productId: "b20", kind: "refill", qty: 15, amount: 75_000, payment: "cash" }, 1090),
  ];

  // Sold counts come from today's receipts so the ledger and the sales list always agree.
  const soldToday = (id: ProductId) =>
    sales.filter((x) => x.day === today && x.productId === id).reduce((a, x) => a + x.qty, 0);
  const line = (productId: ProductId, opening: number, production: number, missing: number | null): StockLine => {
    const sold = soldToday(productId);
    return { productId, opening, production, sales: sold, physical: missing === null ? null : opening + production - sold - missing };
  };
  // Two shortages in the sample day: 2 × 20L bottles and 12 × 18.9L dispensers. Two products still to count.
  const lines: StockLine[] = [
    line("b20", 340, 250, 2),
    line("j20", 180, 120, 0),
    line("d19", 210, 100, 12),
    line("b10", 150, 60, null),
    line("p5", 280, 90, null),
  ];

  // A 30-day cycle of costs (15 entries, RWF 31.2M), repeated for the previous cycle so
  // any 30-day window, including last month, holds a full month of spending.
  type Template = [n: number, offset: number, rest: Omit<Expense, "id" | "ref" | "day">];
  const e = (n: number, offset: number, rest: Omit<Expense, "id" | "ref" | "day">): Template => [n, offset, rest];
  const cycle: Template[] = [
    e(41, 0, { category: "power", description: "3-phase power token, line 1", vendor: "Umeme", amount: 2_800_000, payment: "bank", recordedBy: "Director" }),
    e(40, 0, { category: "transport", description: "Diesel for 2 delivery trucks", vendor: "TotalEnergies", amount: 1_450_000, payment: "mobile", recordedBy: "Operations Mgr" }),
    e(39, 1, { category: "packaging", description: "5,000 caps & shrink seals", vendor: "Polypack Industries", amount: 1_200_000, payment: "bank", recordedBy: "Plant Supervisor" }),
    e(38, 1, { category: "payroll", description: "Casual loaders, night shift", vendor: "Casual staff (14)", amount: 850_000, payment: "cash", recordedBy: "Operations Mgr" }),
    e(37, 2, { category: "repairs", description: "RO filter cartridges", vendor: "AquaPure Systems", amount: 480_000, payment: "mobile", recordedBy: "Plant Supervisor" }),
    e(36, 2, { category: "repairs", description: "Borehole pump service", vendor: "AquaPure Systems", amount: 620_000, payment: "cheque", recordedBy: "Director" }),
    e(35, 5, { category: "payroll", description: "Monthly salaries, floor staff", vendor: "Staff payroll", amount: 6_650_000, payment: "bank", recordedBy: "Director" }),
    e(34, 7, { category: "transport", description: "Diesel, weekly routes", vendor: "TotalEnergies", amount: 1_800_000, payment: "mobile", recordedBy: "Operations Mgr" }),
    e(33, 9, { category: "water", description: "Municipal water bill", vendor: "NWSC", amount: 1_800_000, payment: "bank", recordedBy: "Director" }),
    e(32, 10, { category: "power", description: "3-phase power token, line 1", vendor: "Umeme", amount: 2_800_000, payment: "bank", recordedBy: "Director" }),
    e(31, 12, { category: "packaging", description: "PET preforms, 140g", vendor: "Nice House of Plastics", amount: 2_900_000, payment: "bank", recordedBy: "Director" }),
    e(30, 14, { category: "transport", description: "Diesel, weekly routes", vendor: "TotalEnergies", amount: 1_750_000, payment: "mobile", recordedBy: "Operations Mgr" }),
    e(29, 16, { category: "repairs", description: "Conveyor belt replacement", vendor: "Kampala Engineering", amount: 1_500_000, payment: "bank", recordedBy: "Director" }),
    e(28, 20, { category: "power", description: "3-phase power token, line 1", vendor: "Umeme", amount: 2_800_000, payment: "bank", recordedBy: "Director" }),
    e(27, 21, { category: "transport", description: "Diesel, weekly routes", vendor: "TotalEnergies", amount: 1_800_000, payment: "mobile", recordedBy: "Operations Mgr" }),
  ];
  const expenses: Expense[] = [0, 1].flatMap((c) =>
    cycle.map(([n, offset, rest]) => {
      const num = n - c * cycle.length;
      return { id: `e${num}`, ref: `EXP-${String(num).padStart(3, "0")}`, day: addDays(today, -(offset + 30 * c)), ...rest };
    }),
  );

  // Past sales by weekday rhythm (Friday busiest, Sunday quietest), about RWF 48M a month.
  // Litres: refills ≈ 4 L per 1,000 RWF (20 L at 5,000); new bottles ≈ 0.6 L per 1,000 RWF.
  const rhythm: [refill: number, newBottle: number][] = [
    [1_050_000, 220_000], // Sun
    [1_200_000, 250_000], // Mon
    [1_350_000, 280_000], // Tue
    [1_150_000, 200_000], // Wed
    [1_550_000, 350_000], // Thu
    [1_800_000, 420_000], // Fri
    [1_450_000, 330_000], // Sat
  ];
  const history: HistoryDay[] = [];
  for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
    const day = addDays(today, -offset);
    const [refill, newBottle] = rhythm[new Date(`${day}T00:00:00Z`).getUTCDay()];
    history.push({ day, refill, newBottle, litres: Math.round(refill * 0.004 + newBottle * 0.0006) });
  }

  return {
    today,
    lines,
    materials,
    sales,
    expenses,
    resolutions: [],
    history,
    historyMix: { b20: 0.51, d19: 0.25, j20: 0.115, b10: 0.07, p5: 0.055 },
    dayClosed: false,
  };
}
