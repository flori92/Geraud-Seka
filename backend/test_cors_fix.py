#!/usr/bin/env python3
"""
Script de test pour valider les corrections CORS et les erreurs 500
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any

async def test_cors_and_documents():
    """Test CORS configuration and documents endpoints"""
    
    base_url = "https://api.sekagestion.com"
    
    async with aiohttp.ClientSession() as session:
        
        # 1. Test CORS preflight
        print("🧪 Test CORS preflight OPTIONS...")
        try:
            async with session.options(
                f"{base_url}/api/v1/documents/",
                headers={
                    "Origin": "https://www.sekagestion.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type, Authorization"
                }
            ) as response:
                print(f"   Status: {response.status}")
                cors_headers = {
                    "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                    "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                    "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
                    "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials")
                }
                print(f"   CORS Headers: {cors_headers}")
                
                if response.status == 200:
                    print("   ✅ CORS preflight réussi")
                else:
                    print("   ❌ CORS preflight échoué")
        except Exception as e:
            print(f"   ❌ Erreur CORS preflight: {e}")
        
        # 2. Test GET documents (should work without auth for basic check)
        print("\n🧪 Test GET documents...")
        try:
            async with session.get(
                f"{base_url}/api/v1/documents/",
                headers={"Origin": "https://www.sekagestion.com"}
            ) as response:
                print(f"   Status: {response.status}")
                
                if response.status == 401:
                    print("   ✅ Auth requise (normal)")
                elif response.status == 500:
                    print("   ❌ Erreur 500 toujours présente")
                    error_text = await response.text()
                    print(f"   Error: {error_text[:200]}...")
                else:
                    print(f"   ⚠️  Réponse inattendue: {response.status}")
                    
                # Check CORS headers on error response
                cors_origin = response.headers.get("Access-Control-Allow-Origin")
                if cors_origin:
                    print(f"   ✅ CORS header présent: {cors_origin}")
                else:
                    print("   ❌ CORS header manquant dans la réponse")
                    
        except Exception as e:
            print(f"   ❌ Erreur GET documents: {e}")
        
        # 3. Test root endpoint health
        print("\n🧪 Test endpoint racine...")
        try:
            async with session.get(
                base_url,
                headers={"Origin": "https://www.sekagestion.com"}
            ) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"   ✅ API active: {data.get('message')}")
                    print(f"   🌐 CORS origins configurés: {data.get('cors_origins', [])}")
                else:
                    print("   ❌ API inaccessible")
                    
        except Exception as e:
            print(f"   ❌ Erreur endpoint racine: {e}")

if __name__ == "__main__":
    print("🚀 Test des corrections CORS et API Documents\n")
    asyncio.run(test_cors_and_documents())
    print("\n✨ Tests terminés")
