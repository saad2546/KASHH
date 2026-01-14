import pandas as pd
from prophet import Prophet
from flask import jsonify

def resolve_horizon(horizon):
    # Mapping horizon string to number of periods
    mapping = {"24h": 24, "72h": 72, "7d": 168}
    return mapping.get(horizon, 168)

def predict_patient_flow(request):
    try:
        file = request.files.get("file")
        horizon_key = request.form.get("horizon", "7d")
        
        if not file:
            return jsonify({"error": "No file provided"}), 400

        df = pd.read_csv(file)
        
        # Ensure columns exist
        if not all(col in df.columns for col in ["timestamp", "inflow", "outflow"]):
            return jsonify({"error": "CSV must contain timestamp, inflow, and outflow"}), 400

        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Helper to train and predict
        def get_forecast(target_col, periods):
            m_df = df[["timestamp", target_col]].rename(columns={"timestamp": "ds", target_col: "y"})
            
            # Note: daily_seasonality=True only works if input data is sub-daily
            model = Prophet(daily_seasonality=True, weekly_seasonality=True)
            model.fit(m_df)
            
            future = model.make_future_dataframe(periods=periods, freq="H")
            forecast = model.predict(future)
            return forecast[['ds', 'yhat']]

        periods = resolve_horizon(horizon_key)
        
        inflow_res = get_forecast("inflow", periods)
        outflow_res = get_forecast("outflow", periods)

        # Merge results
        result = inflow_res.tail(periods).copy()
        result["predicted_inflow"] = result["yhat"].clip(lower=0) # No negative patients
        result["predicted_outflow"] = outflow_res.tail(periods)["yhat"].clip(lower=0).values
        
        # Format timestamp for JSON
        result["timestamp"] = result["ds"].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify(result[["timestamp", "predicted_inflow", "predicted_outflow"]].to_dict(orient="records"))

    except Exception as e:
        return jsonify({"error": str(e)}), 500