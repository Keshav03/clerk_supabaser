import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Pricing</h1>
        <p className="text-sm text-zinc-500">
          Pick a plan. Your task limit updates immediately after checkout.
        </p>
      </div>
      <PricingTable
        highlightedPlan="pro"
        appearance={{
          elements: {
            pricingTable: {
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            },
          },
        }}
      />
    </div>
  );
}
