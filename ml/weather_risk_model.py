class WeatherRiskModel:
    def __init__(self):
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        
        # We instantiate a Dummy RandomForest for the Hackathon
        # In a real scenario, this would load weights via joblib.load('weights.pkl')
        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        self.scaler = StandardScaler()
        
        # Train on dummy data to fit the architecture and scaler immediately
        # Features: [Temperature, Humidity, Pressure, Wind_Speed]
        X_dummy = np.array([
            [25.0, 60.0, 1013.0, 5.0],  # Normal
            [35.0, 90.0, 1005.0, 2.0],  # High Fungal Risk
            [42.0, 20.0, 1000.0, 15.0], # High Heat/Drought Risk
            [20.0, 85.0, 1010.0, 3.0]   # Moderate Fungal Risk
        ])
        # Classes: 0: Safe, 1: Heat Stress, 2: Fungal Outbreak
        y_dummy = np.array([0, 2, 1, 2])
        
        self.scaler.fit(X_dummy)
        self.model.fit(self.scaler.transform(X_dummy), y_dummy)
        
    def predict_risk(self, temp: float, humidity: float, pressure: float, wind_speed: float) -> tuple[bool, list[str]]:
        import numpy as np
        features = np.array([[temp, humidity, pressure, wind_speed]])
        features_scaled = self.scaler.transform(features)
        
        risk_class = self.model.predict(features_scaled)[0]
        
        reasons = []
        has_alert = False
        
        if risk_class == 1:
            has_alert = True
            reasons.append(f"AI Model detected high potential for Heat Stress (Temp: {temp}°C, Wind: {wind_speed}km/h).")
        elif risk_class == 2:
            has_alert = True
            reasons.append(f"AI Model computed high probability of Fungal Outbreak due to sustained humidity ({humidity}%).")
            
        return has_alert, reasons

try:
    risk_engine = WeatherRiskModel()
except Exception as e:
    risk_engine = None
    print(f"Weather model initialization failed: {e}")
