import React from 'react';
import { X, Printer, Download, CheckCircle2, Leaf, Shield, Zap, Sun } from 'lucide-react';
import { Invoice } from '../types/index.ts';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isProsumer = invoice.userRole === 'PROSUMER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 my-8">
        {/* Top actions */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {invoice.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Invoice #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet Content */}
        <div className="py-6 space-y-6 text-slate-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950">
                  {isProsumer ? <Sun className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  XYZ Energy Supply Org
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Decentralized Microgrid Clean Energy Settlement
              </p>
              <p className="text-[11px] text-slate-500">
                100 Renewable Way, Suite 400 • clean-grid@xyzenergy.io
              </p>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-slate-400">Statement Date</div>
              <div className="text-sm font-semibold text-slate-200">{new Date(invoice.generatedAt).toLocaleDateString()}</div>
              <div className="text-xs text-slate-400 mt-1">Billing Period</div>
              <div className="text-xs font-medium text-slate-300">
                {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                {isProsumer ? 'Beneficiary Prosumer' : 'Billed Green Consumer'}
              </div>
              <div className="text-sm font-bold text-slate-100">{invoice.userName}</div>
              <div className="text-xs text-slate-400">{invoice.userAddress}</div>
              <div className="text-xs text-emerald-400 mt-1 font-mono">Role: {invoice.userRole}</div>
            </div>

            <div className="sm:text-right flex flex-col justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Settlement Method
                </div>
                <div className="text-xs text-slate-300 font-medium">XYZ Virtual P2P Ledger</div>
              </div>
              <div className="mt-2">
                <span className="text-xs text-slate-400">Verified Smart Contract: </span>
                <span className="text-xs font-mono text-emerald-400">0x7F2A...89E1</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Volume (kWh)</th>
                  <th className="p-3 text-right">Agreed Rate</th>
                  <th className="p-3 text-right">Gov Rate</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-200">{item.description}</td>
                    <td className="p-3 text-right font-mono">{item.quantityKwh.toLocaleString()} kWh</td>
                    <td className="p-3 text-right font-mono text-emerald-300">${item.unitRate.toFixed(3)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">${(item.govtEquivalentAmount / item.quantityKwh).toFixed(3)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Environmental & Financial Value Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Carbon Offset */}
            <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="text-xs text-teal-300 font-semibold">Carbon Emissions Offset</div>
                <div className="text-lg font-extrabold text-teal-200 font-mono">
                  {invoice.co2OffsetKg.toLocaleString()} kg CO₂
                </div>
                <div className="text-[10px] text-teal-400/80">Equivalent to planting {Math.round(invoice.co2OffsetKg / 21)} urban trees</div>
              </div>
            </div>

            {/* Savings / Extra Earnings vs Gov Tariff */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-emerald-300 font-semibold">
                  {isProsumer ? 'Extra Gain vs Govt Buyback' : 'Net Consumer Financial Savings'}
                </div>
                <div className="text-lg font-extrabold text-emerald-300 font-mono">
                  +${invoice.netSavingsAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400/80">
                  {isProsumer
                    ? `Earned $${invoice.netSavingsAmount.toFixed(2)} more than govt export feed-in tariff`
                    : `Saved vs standard public utility retail tier ($${invoice.govtCostComparison.toFixed(2)})`}
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total Breakdown */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Energy Volume Traded</span>
              <span className="font-mono">{invoice.totalKwh.toLocaleString()} kWh</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Standard Public Grid Equivalent Cost</span>
              <span className="font-mono line-through text-slate-500">${invoice.govtCostComparison.toFixed(2)}</span>
            </div>
            {invoice.platformFee > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>XYZ Platform Aggregation Fee</span>
                <span className="font-mono">${invoice.platformFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-100">
                {isProsumer ? 'Net Prosumer Earnings Credited' : 'Total Green Energy Charged'}
              </span>
              <span className="font-mono text-xl font-extrabold text-emerald-400">
                ${invoice.totalAmount.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          This digital settlement invoice is cryptographically recorded in XYZ Energy Share's virtual microgrid ledger.
        </div>
      </div>
    </div>
  );
};
