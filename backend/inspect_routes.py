#!/usr/bin/env python3
"""
Route inspection tool - check all registered routes
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from server import app

def inspect_routes():
    """Inspect all registered routes in the FastAPI app"""
    
    print("🔍 FASTAPI ROUTE INSPECTION")
    print("=" * 60)
    
    print(f"📱 App title: {app.title}")
    print(f"📊 Total routes: {len(app.routes)}")
    print()
    
    print("📋 ALL REGISTERED ROUTES:")
    print("-" * 40)
    
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            methods = list(route.methods) if route.methods else ['Unknown']
            print(f"   {methods[0]:6s} {route.path}")
        elif hasattr(route, 'prefix'):
            print(f"   Router: {route.prefix} (Sub-router)")
            
            # If it's a router, check its routes too
            if hasattr(route, 'router') and hasattr(route.router, 'routes'):
                for sub_route in route.router.routes:
                    if hasattr(sub_route, 'path') and hasattr(sub_route, 'methods'):
                        methods = list(sub_route.methods) if sub_route.methods else ['Unknown']
                        full_path = route.prefix + sub_route.path
                        print(f"      {methods[0]:6s} {full_path}")
        else:
            print(f"   Unknown route type: {type(route)}")
    
    print()
    print("🔍 SEARCHING FOR APPLICATIONS ROUTES:")
    print("-" * 40)
    
    applications_routes = []
    
    def find_routes_recursively(routes, prefix=""):
        for route in routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                full_path = prefix + route.path
                if 'applications' in full_path:
                    methods = list(route.methods) if route.methods else ['Unknown']
                    applications_routes.append((methods[0], full_path))
            elif hasattr(route, 'routes'):
                new_prefix = prefix + getattr(route, 'prefix', '')
                find_routes_recursively(route.routes, new_prefix)
    
    find_routes_recursively(app.routes)
    
    if applications_routes:
        for method, path in applications_routes:
            print(f"   ✅ {method:6s} {path}")
    else:
        print("   ❌ No applications routes found!")
    
    print()
    print("🎯 SPECIFIC ROUTE CHECK:")
    print("-" * 30)
    
    target_path = "/api/applications/recruiter/recent"
    
    def check_specific_route(routes, prefix=""):
        found = False
        for route in routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                full_path = prefix + route.path
                if full_path == target_path:
                    methods = list(route.methods) if route.methods else ['Unknown']
                    print(f"   ✅ FOUND: {methods[0]} {full_path}")
                    found = True
            elif hasattr(route, 'routes'):
                new_prefix = prefix + getattr(route, 'prefix', '')
                if check_specific_route(route.routes, new_prefix):
                    found = True
        return found
    
    if not check_specific_route(app.routes):
        print(f"   ❌ Route NOT FOUND: {target_path}")
        print(f"   🔍 This explains the 404 error!")

if __name__ == "__main__":
    inspect_routes()