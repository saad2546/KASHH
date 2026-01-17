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
  Area,
} from "recharts";
import { useHospital } from "@/context/HospitalContext";

function formatLabel(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PatientFlow() {
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { hospital } = useHospital();

  // Only 7 day forecast
  const timeframe = "7d";

  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);

  // use hospital context beds
  const totalBeds = Number(hospital?.number_of_beds || 200);
  const currentOccupancy = Math.round(totalBeds * 0.6);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("horizon", "7d");

      const response = await fetch(
        `${API_URL}/api/predict-patient-flow`,
        {
          method: "POST",
          body: formData,
        }
      );

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
    if (!forecastData) return [];

    return forecastData.map((pt) => ({
      time: formatLabel(pt.timestamp),

      admissions: Math.round(pt.predicted_inflow),
      discharges: Math.round(pt.predicted_outflow),

      inflow_lower: Math.round(
        pt.predicted_inflow_lower ?? pt.predicted_inflow
      ),
      inflow_upper: Math.round(
        pt.predicted_inflow_upper ?? pt.predicted_inflow
      ),
    }));
  }, [forecastData]);

  const { predictedOccupied, occupancyPercent, occupancyStatus, timeframeLabel } =
    useMemo(() => {
      if (!forecastData || data.length === 0) {
        return {
          predictedOccupied: 0,
          occupancyPercent: 0,
          occupancyStatus: "safe",
          timeframeLabel: "Next 7 days",
        };
      }

      const net = data.reduce((a, d) => a + (d.admissions - d.discharges), 0);
      const predicted = Math.max(
        0,
        Math.min(totalBeds, currentOccupancy + Math.round(net))
      );

      const percent = Math.round((predicted / totalBeds) * 100);
      const status =
        percent > 85 ? "critical" : percent >= 70 ? "watch" : "safe";

      return {
        predictedOccupied: predicted,
        occupancyPercent: percent,
        occupancyStatus: status,
        timeframeLabel: "Next 7 days",
      };
    }, [forecastData, data, totalBeds]);

  const {
    expectedAdmissions,
    expectedDischarges,
    netLabel,
    netColor,
    peakHour,
    riskText,
  } = useMemo(() => {
    if (!forecastData || data.length === 0) {
      return {
        expectedAdmissions: 0,
        expectedDischarges: 0,
        netLabel: "",
        netColor: "",
        peakHour: "-",
        riskText: "",
      };
    }

    const a = data.reduce((s, d) => s + d.admissions, 0);
    const d = data.reduce((s, d) => s + d.discharges, 0);
    const net = a - d;

    const peak =
      data.length > 0
        ? data.reduce((p, c) => (c.admissions > p.admissions ? c : p)).time
        : "-";

    return {
      expectedAdmissions: a,
      expectedDischarges: d,
      netLabel:
        net > 0
          ? `+${net} (Growth)`
          : net < 0
          ? `${net} (Relief)`
          : "0 (Stable)",
      netColor:
        net > 0
          ? "text-red-600"
          : net < 0
          ? "text-green-600"
          : "text-slate-600",
      peakHour: peak,
      riskText:
        occupancyStatus === "critical"
          ? "High"
          : occupancyStatus === "watch"
          ? "Medium"
          : "Low",
    };
  }, [forecastData, data, occupancyStatus]);

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 space-y-8">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="mt-10 space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Flow <span className="text-blue-600">Forecast</span>
          </h1>

          <p className="text-slate-500 font-medium">
            Upload historical inflow/outflow (hourly/daily) to predict next 7
            days.
          </p>

          {/* Upload */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <label className="block font-semibold text-sky-700 mb-2">
              Upload CSV Data (timestamp, inflow, outflow)
            </label>

            <div className="flex gap-3 items-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              />

              {uploadedFile && (
                <span className="text-emerald-600 text-sm font-medium">
                  ✓ {uploadedFile.name}
                </span>
              )}
              {isLoading && (
                <span className="text-sky-600 text-sm font-medium">
                  Loading...
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Recommended: upload at least <b>14–21 days</b> of historical data
              for good accuracy on 7-day forecast.
            </p>
          </div>
        </header>

        {/* Only show KPIs after upload */}
        {forecastData && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ["Expected Admissions", expectedAdmissions],
              ["Expected Discharges", expectedDischarges],
              ["Net Change", netLabel, netColor],
              ["Peak Hour", peakHour],
              ["Risk Level", riskText],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm"
              >
                <div className="text-sm text-slate-500">{label}</div>
                <div className={`text-xl font-bold mt-1 ${color || ""}`}>
                  {value}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Only show chart after upload */}
        {forecastData && (
          <main className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Legend />

                {/* Confidence Band */}
                <Area
                  type="monotone"
                  dataKey="inflow_upper"
                  stroke="none"
                  fill="#2563eb"
                  fillOpacity={0.18}
                  name="Admissions CI (upper)"
                />
                <Area
                  type="monotone"
                  dataKey="inflow_lower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Admissions CI (lower)"
                />

                {/* Forecast Lines */}
                <Line
                  type="monotone"
                  dataKey="admissions"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Admissions"
                />
                <Line
                  type="monotone"
                  dataKey="discharges"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                  name="Discharges"
                />
              </LineChart>
            </ResponsiveContainer>
          </main>
        )}

        {/* Before upload show nothing except hint */}
        {!forecastData && (
          <div className="text-center text-slate-500 text-sm py-10">
            Upload a CSV file to generate the 7-day forecast.
          </div>
        )}

        {forecastData && (
          <p className="text-sm text-slate-500">
            Showing <strong>7-day forecast</strong> from uploaded data.
          </p>
        )}
      </div>
    </div>
  );
}
