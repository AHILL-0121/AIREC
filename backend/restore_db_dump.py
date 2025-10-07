#!/usr/bin/env python3
"""
MongoDB Database Restore Script
Restores data from a dump file created by create_db_dump.py
"""

import asyncio
import json
import sys
from pathlib import Path
from utils.db import get_database
from bson import ObjectId
from datetime import datetime

async def restore_database_dump(dump_file_path):
    """Restore database from dump file"""
    
    # Handle relative path from db directory
    if not Path(dump_file_path).is_absolute():
        dump_file = Path("../db") / dump_file_path
    else:
        dump_file = Path(dump_file_path)
    
    if not dump_file.exists():
        print(f"❌ Dump file not found: {dump_file}")
        print(f"📁 Looking in: {dump_file.absolute()}")
        return False
    
    print(f"🔄 Restoring database from: {dump_file.name}")
    print(f"📁 Full path: {dump_file.absolute()}")
    
    # Load dump data
    try:
        with open(dump_file, 'r', encoding='utf-8') as f:
            dump_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading dump file: {e}")
        return False
    
    # Show dump info
    dump_info = dump_data.get("dump_info", {})
    print(f"📊 Dump created: {dump_info.get('timestamp', 'Unknown')}")
    print(f"🗄️  Database: {dump_info.get('database', 'Unknown')}")
    print(f"📋 Collections: {len(dump_info.get('collections', []))}")
    print(f"📄 Total documents: {dump_info.get('total_documents', 'Unknown')}")
    print()
    
    # Get database connection
    db = get_database()
    
    # Ask for confirmation
    response = input("⚠️  This will replace existing data. Continue? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("❌ Restore cancelled by user")
        return False
    
    # Restore each collection
    total_restored = 0
    
    for collection_name, documents in dump_data["data"].items():
        print(f"📋 Restoring collection: {collection_name}")
        
        try:
            collection = db[collection_name]
            
            # Clear existing data
            delete_result = await collection.delete_many({})
            print(f"   🗑️  Cleared {delete_result.deleted_count} existing documents")
            
            if documents:
                # Convert string _id back to ObjectId if needed
                for doc in documents:
                    if "_id" in doc and isinstance(doc["_id"], str):
                        try:
                            doc["_id"] = ObjectId(doc["_id"])
                        except:
                            pass  # Keep as string if not valid ObjectId
                
                # Insert documents
                result = await collection.insert_many(documents)
                restored_count = len(result.inserted_ids)
                total_restored += restored_count
                print(f"   ✅ {restored_count} documents restored")
            else:
                print(f"   ⚠️  No documents to restore")
                
        except Exception as e:
            print(f"   ❌ Error restoring {collection_name}: {e}")
    
    print()
    print("=" * 60)
    print("🎉 DATABASE RESTORE COMPLETED!")
    print("=" * 60)
    print(f"📊 Total documents restored: {total_restored}")
    print(f"📁 From file: {dump_file.name}")
    print(f"🕐 Restored at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

async def list_available_dumps():
    """List available dump files in the db directory"""
    
    db_dir = Path("../db")
    
    if not db_dir.exists():
        print("❌ db directory not found")
        return []
    
    # Find dump files
    dump_files = list(db_dir.glob("*dump*.json"))
    
    if not dump_files:
        print("⚠️  No dump files found in db directory")
        return []
    
    print("📁 Available dump files:")
    print("-" * 40)
    
    for i, dump_file in enumerate(sorted(dump_files), 1):
        try:
            # Get file info
            stat = dump_file.stat()
            size = stat.st_size / 1024  # KB
            modified = datetime.fromtimestamp(stat.st_mtime)
            
            # Try to read dump info
            try:
                with open(dump_file, 'r') as f:
                    dump_data = json.load(f)
                    dump_info = dump_data.get("dump_info", {})
                    total_docs = dump_info.get("total_documents", "Unknown")
                    created = dump_info.get("timestamp", "Unknown")
                    
                print(f"{i:2d}. {dump_file.name}")
                print(f"     📊 Documents: {total_docs}")
                print(f"     💾 Size: {size:.1f} KB")
                print(f"     🕐 Created: {created}")
                print()
            except:
                print(f"{i:2d}. {dump_file.name}")
                print(f"     💾 Size: {size:.1f} KB")
                print(f"     🕐 Modified: {modified.strftime('%Y-%m-%d %H:%M:%S')}")
                print()
                
        except Exception as e:
            print(f"{i:2d}. {dump_file.name} (Error reading file info)")
    
    return dump_files

if __name__ == "__main__":
    print("🔄 MongoDB Database Restore Tool")
    print("=" * 40)
    
    if len(sys.argv) == 1:
        # No file specified, list available dumps
        print("📁 Scanning for available dump files...\n")
        asyncio.run(list_available_dumps())
        
        print("\nUSAGE:")
        print("  python restore_db_dump.py <dump_file>")
        print("\nEXAMPLE:")
        print("  python restore_db_dump.py job_matching_db_dump_20251007_123456.json")
        print("  python restore_db_dump.py latest_dump.json")
        
    elif len(sys.argv) == 2:
        dump_file = sys.argv[1]
        asyncio.run(restore_database_dump(dump_file))
        
    else:
        print("❌ Invalid arguments")
        print("Usage: python restore_db_dump.py [dump_file]")
        sys.exit(1)