import os
from tools.rag import search_agri_knowledge
from dotenv import load_dotenv

load_dotenv()

def verify_rag():
    print("=== RAG Sanity Check ===")
    queries = [
        "What are the common diseases in rice?",
        "How to manage soil fertility?",
        "Best practices for wheat cultivation"
    ]
    
    for query in queries:
        print(f"\nSearching for: '{query}'...")
        results = search_agri_knowledge(query)
        
        if results and results != "No relevant agricultural knowledge found.":
            print(f"SUCCESS: Found relevant data!")
            # Print a snippet of the first result
            snippet = results[:300] + "..." if len(results) > 300 else results
            print(f"Result Snippet: {snippet}")
        else:
            print(f"FAILED: No results found for '{query}'")

if __name__ == "__main__":
    verify_rag()
