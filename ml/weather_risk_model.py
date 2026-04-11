class WeatherRiskModel:
    def __init__(self):
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        
        # We instantiate a Dummy RandomForest for the Hackathon
        # In a real scenario, this would load weights via joblib.load('weights.pkl')
        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        self.scaler = StandardScaler()
        
        # Train on expanded dummy data so the decision boundary is realistic
        # In a real scenario, this would load weights via joblib.load('weights.pkl')
        # Features: [Temperature, Humidity, Pressure, Wind_Speed]
        X_dummy = np.array([
            # Safe conditions (class 0)
            [25.0, 60.0, 1013.0, 5.0],
            [28.0, 55.0, 1012.0, 8.0],
            [30.0, 65.0, 1010.0, 6.0],
            [22.0, 50.0, 1015.0, 4.0],
            [27.0, 70.0, 1011.0, 7.0],
            [32.0, 45.0, 1009.0, 10.0],
            [20.0, 40.0, 1014.0, 3.0],
            [26.0, 36.0, 1012.0, 5.0],   # 36% humidity = SAFE
            # Heat Stress (class 1) — temp > 40°C
            [42.0, 20.0, 1000.0, 15.0],
            [44.0, 25.0, 998.0, 12.0],
            [41.0, 30.0, 1001.0, 18.0],
            [45.0, 15.0, 995.0, 20.0],
            # Fungal Outbreak (class 2) — humidity > 85%
            [28.0, 92.0, 1005.0, 2.0],
            [25.0, 88.0, 1008.0, 3.0],
            [30.0, 95.0, 1003.0, 1.0],
            [22.0, 90.0, 1006.0, 4.0],
        ])
        # Classes: 0=Safe, 1=Heat Stress, 2=Fungal Outbreak
        y_dummy = np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2])
        
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
