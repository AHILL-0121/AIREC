#!/usr/bin/env python3
"""
Database Dump Viewer
View contents of database dump files in a readable format
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def view_dump(dump_file_path):
    """View database dump in readable format"""
    
    # Handle relative path from db directory
    if not Path(dump_file_path).is_absolute():
        dump_file = Path("../db") / dump_file_path
    else:
        dump_file = Path(dump_file_path)
    
    if not dump_file.exists():
        print(f"❌ Dump file not found: {dump_file}")
        return False
    
    print(f"📄 Viewing dump file: {dump_file.name}")
    print(f"📁 Full path: {dump_file.absolute()}")
    print("=" * 80)
    
    try:
        with open(dump_file, 'r', encoding='utf-8') as f:
            dump_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading dump file: {e}")
        return False
    
    # Show dump info
    dump_info = dump_data.get("dump_info", {})
    print("📊 DUMP INFORMATION")
    print("-" * 40)
    print(f"🕐 Created: {dump_info.get('timestamp', 'Unknown')}")
    print(f"🗄️  Database: {dump_info.get('database', 'Unknown')}")
    print(f"📋 Collections: {len(dump_info.get('collections', []))}")
    print(f"📄 Total documents: {dump_info.get('total_documents', 'Unknown')}")
    print(f"💾 File size: {dump_info.get('file_size_kb', 'Unknown')} KB")
    print()
    
    # Show collection data
    for collection_name, documents in dump_data["data"].items():
        print(f"📋 COLLECTION: {collection_name.upper()}")
        print("-" * 40)
        print(f"📊 Document count: {len(documents)}")
        
        if documents:
            print("📝 Sample document (first one):")
            sample_doc = documents[0]
            
            # Show document structure
            for key, value in sample_doc.items():
                if key == "_id":
                    print(f"   🔑 {key}: {value}")
                elif isinstance(value, str) and len(value) > 100:
                    print(f"   📄 {key}: {value[:100]}...")
                elif isinstance(value, dict):
                    print(f"   📦 {key}: {type(value).__name__} with {len(value)} keys")
                elif isinstance(value, list):
                    print(f"   📚 {key}: {type(value).__name__} with {len(value)} items")
                else:
                    print(f"   🏷️  {key}: {value}")
            
            # If there are multiple documents, show their IDs
            if len(documents) > 1:
                print(f"\n   📋 All document IDs in {collection_name}:")
                for i, doc in enumerate(documents):
                    doc_id = doc.get("_id", "No ID")
                    if "email" in doc:
                        print(f"      {i+1:2d}. {doc_id} (email: {doc.get('email')})")
                    elif "title" in doc:
                        print(f"      {i+1:2d}. {doc_id} (title: {doc.get('title', 'No title')[:50]})")
                    elif "job_id" in doc:
                        print(f"      {i+1:2d}. {doc_id} (job_id: {doc.get('job_id')})")
                    else:
                        print(f"      {i+1:2d}. {doc_id}")
        else:
            print("   ⚠️  No documents in this collection")
        
        print()
    
    return True

def show_stats(dump_file_path):
    """Show quick statistics about the dump"""
    
    # Handle relative path from db directory
    if not Path(dump_file_path).is_absolute():
        dump_file = Path("../db") / dump_file_path
    else:
        dump_file = Path(dump_file_path)
    
    if not dump_file.exists():
        print(f"❌ Dump file not found: {dump_file}")
        return False
    
    try:
        with open(dump_file, 'r', encoding='utf-8') as f:
            dump_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading dump file: {e}")
        return False
    
    print(f"📊 QUICK STATS: {dump_file.name}")
    print("=" * 50)
    
    # Basic info
    dump_info = dump_data.get("dump_info", {})
    print(f"🗄️  Database: {dump_info.get('database', 'Unknown')}")
    print(f"📋 Collections: {len(dump_info.get('collections', []))}")
    print(f"📄 Total documents: {dump_info.get('total_documents', 'Unknown')}")
    
    # Collection breakdown
    print("\n📊 COLLECTION BREAKDOWN:")
    print("-" * 30)
    for collection_name, documents in dump_data["data"].items():
        print(f"   📋 {collection_name:12s}: {len(documents):3d} documents")
    
    print()
    return True

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("📄 Database Dump Viewer")
        print("=" * 40)
        print()
        print("USAGE:")
        print("  python view_dump.py <dump_file> [--stats]")
        print()
        print("EXAMPLES:")
        print("  python view_dump.py latest_dump.json")
        print("  python view_dump.py job_matching_db_dump_20251007_111857.json")
        print("  python view_dump.py latest_dump.json --stats")
        
    elif len(sys.argv) == 2:
        dump_file = sys.argv[1]
        view_dump(dump_file)
        
    elif len(sys.argv) == 3 and sys.argv[2] == "--stats":
        dump_file = sys.argv[1]
        show_stats(dump_file)
        
    else:
        print("❌ Invalid arguments")
        print("Usage: python view_dump.py <dump_file> [--stats]")
        sys.exit(1)