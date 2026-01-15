import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import getForecast from "../lib/forecast";

function formatLabel(iso, timeframe) {
  const d = new Date(iso);
  if (timeframe === "24h" || timeframe === "72h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("24h");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("horizon", timeframe);

      const response = await fetch("http://localhost:5000/api/forecast", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setForecastData(result);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const data = useMemo(() => {
    if (forecastData) {
      return forecastData.map((pt) => ({
        time: formatLabel(pt.timestamp, timeframe),
        admissions: Math.round(pt.predicted_inflow),
        discharges: Math.round(pt.predicted_outflow),
      }));
    }
    return getForecast(timeframe).map((pt) => ({
      time: formatLabel(pt.time, timeframe),
      admissions: Math.round(pt.admissions),
      discharges: Math.round(pt.discharges),
    }));
  }, [timeframe, forecastData]);

  const totalBeds = 200;
  const currentOccupancy = Math.round(totalBeds * 0.6);

  const { predictedOccupied, occupancyPercent, occupancyStatus, timeframeLabel } =
    useMemo(() => {
      const net = data.reduce((a, d) => a + (d.admissions - d.discharges), 0);
      const predicted = Math.max(
        0,
        Math.min(totalBeds, currentOccupancy + Math.round(net))
      );
      const percent = Math.round((predicted / totalBeds) * 100);
      const status =
        percent > 85 ? "critical" : percent >= 70 ? "watch" : "safe";
      const label =
        timeframe === "24h"
          ? "Tomorrow"
          : timeframe === "72h"
          ? "Next 72 hours"
          : "Next 7 days";
      return { predictedOccupied: predicted, occupancyPercent: percent, occupancyStatus: status, timeframeLabel: label };
    }, [data, timeframe]);

  const { expectedAdmissions, expectedDischarges, netChange, peakHour, riskText } =
    useMemo(() => {
      const a = data.reduce((s, d) => s + d.admissions, 0);
      const d = data.reduce((s, d) => s + d.discharges, 0);
      const peak =
        data.length > 0
          ? data.reduce((p, c) => (c.admissions > p.admissions ? c : p))
              .time
          : "-";
      return {
        expectedAdmissions: a,
        expectedDischarges: d,
        netChange: a - d,
        peakHour: peak,
        riskText:
          occupancyStatus === "critical"
            ? "🔴 High"
            : occupancyStatus === "watch"
            ? "🟡 Medium"
            : "🟢 Low",
      };
    }, [data, occupancyStatus]);

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 space-y-8">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
      <header className="mt-10 space-y-6">
        <h1 className="text-3xl font-bold">Inflow vs Outflow Forecast</h1>

        {/* Upload */}
        <div className="bg-sky-50 border border-sky-400 rounded-lg p-4">
          <label className="block font-semibold text-sky-700 mb-2">
            Upload CSV Data (timestamp, inflow, outflow)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            {uploadedFile && (
              <span className="text-emerald-600 text-sm">
                ✓ {uploadedFile.name}
              </span>
            )}
            {isLoading && (
              <span className="text-sky-600 text-sm">Loading...</span>
            )}
          </div>
        </div>

        {/* Timeframe */}
        <div className="flex gap-3">
          {["24h", "72h", "7d"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-md border font-medium ${
                timeframe === tf
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {tf === "24h"
                ? "Next 24 hours"
                : tf === "72h"
                ? "Next 72 hours"
                : "Next 7 days"}
            </button>
          ))}
        </div>

        {/* Occupancy */}
        <div className="bg-white border rounded-xl p-6 shadow">
          <h2 className="font-semibold text-lg mb-4">
            Bed Occupancy Forecast (Critical KPI)
          </h2>

          <div className="flex justify-between text-sm mb-2">
            <span>Total Beds: <strong>{totalBeds}</strong></span>
            <span>
              Predicted ({timeframeLabel}):{" "}
              <strong>{predictedOccupied} ({occupancyPercent}%)</strong>
            </span>
          </div>

          <div className="h-3 bg-gray-200 rounded overflow-hidden mb-3">
            <div
              className={`h-full ${
                occupancyStatus === "critical"
                  ? "bg-red-500"
                  : occupancyStatus === "watch"
                  ? "bg-yellow-400"
                  : "bg-green-500"
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs">
            <span>🟢 &lt;70%</span>
            <span>🟡 70–85%</span>
            <span>🔴 &gt;85%</span>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          ["Expected Admissions", expectedAdmissions],
          ["Expected Discharges", expectedDischarges],
          ["Net Change", netChange >= 0 ? `+${netChange}` : netChange],
          ["Peak Hour", peakHour],
          ["Risk Level", riskText],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white border rounded-lg p-4 text-center shadow-sm"
          >
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-xl font-bold mt-1">{value}</div>
          </div>
        ))}
      </section>

      {/* Chart */}
      <main className="bg-white border rounded-xl p-4 shadow">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="admissions"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="discharges"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </main>

      <p className="text-sm text-gray-500">
        Showing <strong>{timeframe}</strong> forecast{" "}
        {forecastData ? "from uploaded data" : "with mocked data"}.
      </p>
      </div>
    </div>
  );
}
