import React, { useEffect, useMemo, useState } from "react";
import { PackageSearch, AlertTriangle, Boxes, TrendingDown } from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

import { useHospital } from "@/context/HospitalContext";
import MetricCard from "@/components/MetricCard";
import InventoryForm from "@/components/InventoryForm";
import InventoryTable from "@/components/InventoryTable";
import InventoryInsights from "@/components/InventoryInsights";

export default function Inventory() {
  const { hospital, loading } = useHospital();

  const [items, setItems] = useState([]);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Realtime Inventory Listener
  useEffect(() => {
    if (loading) return;
    if (!hospital?.id) return;

    const q = query(collection(db, "hospitals", hospital.id, "inventory"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setItems(rows);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load inventory");
      }
    );

    return () => unsub();
  }, [hospital?.id, loading]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalItems = items.length;

    const totalStock = items.reduce((sum, i) => sum + Number(i.stock || 0), 0);

    const lowStockItems = items.filter(
      (i) => Number(i.stock || 0) <= Number(i.min_stock || 0)
    ).length;

    const expiringSoon = items.filter((i) => {
      if (!i.expiry_date) return false;
      const expiry = new Date(i.expiry_date);
      const now = new Date();
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    return {
      totalItems,
      totalStock,
      lowStockItems,
      expiringSoon,
    };
  }, [items]);

  // Gemini AI insights call
  const fetchInsights = async () => {
    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    if (items.length === 0) {
      toast.error("No inventory found");
      return;
    }

    setInsightsLoading(true);
    setInsights(null);

    try {
      const response = await fetch("http://localhost:5000/api/inventory-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hospital.id,
          hospital_name: hospital.hospital_name || "Hospital",
          inventory: items.map((i) => ({
            name: i.name,
            category: i.category,
            stock: Number(i.stock || 0),
            min_stock: Number(i.min_stock || 0),
            expiry_date: i.expiry_date || null,
            unit: i.unit || "units",
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to generate insights");
        return;
      }

      setInsights(data.insights);
      toast.success("AI Insights generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to Gemini insights API");
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading hospital...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 space-y-8">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PackageSearch className="text-blue-600" size={22} />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Operations Hub
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Pharmacy <span className="text-blue-600">Inventory</span>
            </h1>

            <p className="text-slate-500 font-medium">
              Track medicine stock levels, shortages, expiry and restocking needs
            </p>
          </div>

          <button
            onClick={fetchInsights}
            disabled={insightsLoading}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-60"
          >
            {insightsLoading ? "Generating..." : "Run AI Insights"}
          </button>
        </header>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Medicines Tracked"
            value={kpis.totalItems}
            subtext="Unique inventory items"
          />
          <MetricCard
            title="Total Stock Units"
            value={kpis.totalStock}
            subtext="Total units across all items"
          />
          <MetricCard
            title="Low Stock Alerts"
            value={kpis.lowStockItems}
            subtext="Items below threshold"
          />
          <MetricCard
            title="Expiry Risk (30d)"
            value={kpis.expiringSoon}
            subtext="Items expiring soon"
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* LEFT */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <InventoryForm />

            {insightsLoading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-sm text-slate-500 font-medium">Generating insights...</p>
              </div>
            ) : insights ? (
              <InventoryInsights insights={insights} />
            ) : null}

          </aside>

          {/* RIGHT */}
          <main className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center px-6 py-4 bg-blue-50 border-b border-blue-100">
                <span className="font-semibold text-blue-900">
                  Live Inventory
                </span>

                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Low stock
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    Healthy
                  </span>
                </div>
              </div>

              <InventoryTable items={items} />
            </div>

            {/* Small Context Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">
                    Inventory Attention
                  </span>
                </div>
                <p className="text-sm itali
                c text-amber-700">
                  “Low stock medicines must be replenished to avoid treatment delays.”
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Boxes size={18} className="text-green-700" />
                  <span className="text-sm font-bold text-green-800">
                    Stock Health
                  </span>
                </div>
                <p className="text-sm italic text-green-700">
                  “Keep min stock thresholds realistic for emergency load.”
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
