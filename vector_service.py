import logging
from typing import List

logger = logging.getLogger(__name__)

class AgriVectorDB:
    """
    A mock Retrieval-Augmented Generation (RAG) vector service.
    In a real-world application, this would interface with ChromaDB, Milvus, or Pinecone.
    """
    
    KNOWLEDGE_BASE = [
        "ORGANIC FERTILIZERS: For nitrogen deficiency, replace chemical urea with Jeevamrutha or Neem cake. Apply 200 liters of Jeevamrutha per acre continuously with irrigation.",
        "GOVT SUBSIDIES: The PM-Kisan scheme provides ₹6,000 annually to small and marginal farmers. Farmers can also apply for the Soil Health Card scheme to get free soil testing.",
        "CROPPING SEASONS: Kharif (Monsoon) crops include Rice, Maize, and Cotton. Rabi (Winter) crops include Wheat, Barley, and Mustard.",
        "PEST MANAGEMENT: For cotton bollworms, spray Neem Seed Kernel Extract (NSKE 5%) instead of chemical pesticides. Alternate with pheromone traps.",
        "IRRIGATION: Drip irrigation during the Rabi season ensures 40% water savings. Critical for crops like wheat if winter rains fail."
    ]
    
    @staticmethod
    async def query_agri_knowledge_base(query: str, top_k: int = 2) -> List[str]:
        """
        Simulates embedding a query and retrieving the top semantic matches based on keywords.
        """
        logger.info(f"RAG Vector Search initiated for query: '{query}'")
        
        query_lower = query.lower()
        results = []
        
        if "organic" in query_lower or "fertilizer" in query_lower or "urea" in query_lower:
            results.append(AgriVectorDB.KNOWLEDGE_BASE[0])
            
        if "subsidy" in query_lower or "scheme" in query_lower or "money" in query_lower or "govt" in query_lower:
            results.append(AgriVectorDB.KNOWLEDGE_BASE[1])
            
        if "season" in query_lower or "kharif" in query_lower or "rabi" in query_lower or "rice" in query_lower or "wheat" in query_lower:
            results.append(AgriVectorDB.KNOWLEDGE_BASE[2])
            
        if "pest" in query_lower or "worm" in query_lower or "insect" in query_lower:
            results.append(AgriVectorDB.KNOWLEDGE_BASE[3])
            
        if "water" in query_lower or "irrig" in query_lower or "rain" in query_lower:
            results.append(AgriVectorDB.KNOWLEDGE_BASE[4])
            
        # If no strict keyword matches, simulate semantic similarity by returning generic advice
        if not results:
            results = AgriVectorDB.KNOWLEDGE_BASE[:top_k]
            
        # Return top_k hits (mocked)
        return results[:top_k]
