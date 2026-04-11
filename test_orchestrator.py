from orchestrator.agent import run_analysis_workflow
import json

def run_tests():
    print("=== Test Case A: Healthy leaf + High Humidity ===")
    res_a = run_analysis_workflow(
        image_url="http://example.com/healthy_leaf.jpg",
        lat=25.0,  # > 20 latitude gives high humidity in our mock
        lon=80.0,
        preferred_language="Hindi"
    )
    print(json.dumps(res_a, indent=2))
    
    print("\n=== Test Case B: Rust Fungus + Dry Weather ===")
    res_b = run_analysis_workflow(
        image_url="http://example.com/rust_fungus.jpg",
        lat=15.0,  # <= 20 latitude gives dry weather in our mock
        lon=80.0,
        preferred_language="Hindi"
    )
    print(json.dumps(res_b, indent=2))
    
    print("\n=== Guardrail Test: Non-Agricultural Image ===")
    res_c = run_analysis_workflow(
        image_url="http://example.com/non_agri_car.jpg",
        lat=20.0,
        lon=80.0,
        preferred_language="Hindi"
    )
    print(json.dumps(res_c, indent=2))

if __name__ == "__main__":
    run_tests()
