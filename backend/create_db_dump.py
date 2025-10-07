#!/usr/bin/env python3
"""
MongoDB Database Dump Script
Creates a comprehensive dump of all collections in the job_matching_db database
Saves the dump to the db directory
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from utils.db import get_database
from bson import ObjectId
import os

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle MongoDB ObjectId and datetime objects"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def create_database_dump():
    """Create a complete dump of the database"""
    
    # Get database connection
    db = get_database()
    
    # Create db directory path (relative to backend folder)
    db_dir = Path("../db")
    db_dir.mkdir(exist_ok=True)
    
    # Create timestamp for dump file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dump_file = db_dir / f"job_matching_db_dump_{timestamp}.json"
    
    # Collections to dump
    collections = [
        "users",
        "jobs", 
        "applications",
        "profiles"
    ]
    
    dump_data = {
        "dump_info": {
            "timestamp": datetime.now().isoformat(),
            "database": "job_matching_db",
            "collections": collections,
            "version": "1.0"
        },
        "data": {}
    }
    
    print(f"🗃️  Creating database dump...")
    print(f"📁 Database: job_matching_db")
    print(f"📁 Output file: {dump_file.absolute()}")
    print()
    
    total_documents = 0
    
    for collection_name in collections:
        print(f"📋 Dumping collection: {collection_name}")
        
        try:
            collection = db[collection_name]
            documents = await collection.find({}).to_list(length=None)
            
            # Convert documents to serializable format
            serializable_docs = []
            for doc in documents:
                # Create a copy to avoid modifying original
                doc_copy = dict(doc)
                
                # Convert ObjectId fields to strings
                if "_id" in doc_copy:
                    doc_copy["_id"] = str(doc_copy["_id"])
                
                # Handle any other ObjectId fields
                for key, value in doc_copy.items():
                    if isinstance(value, ObjectId):
                        doc_copy[key] = str(value)
                
                serializable_docs.append(doc_copy)
            
            dump_data["data"][collection_name] = serializable_docs
            
            doc_count = len(documents)
            total_documents += doc_count
            print(f"   ✅ {doc_count} documents exported")
            
        except Exception as e:
            print(f"   ❌ Error dumping {collection_name}: {e}")
            dump_data["data"][collection_name] = []
    
    # Add summary to dump
    dump_data["dump_info"]["total_documents"] = total_documents
    dump_data["dump_info"]["collections_count"] = len([c for c in collections if dump_data["data"][c]])
    
    # Write dump to file
    try:
        with open(dump_file, 'w', encoding='utf-8') as f:
            json.dump(dump_data, f, cls=JSONEncoder, indent=2, ensure_ascii=False)
        
        file_size = os.path.getsize(dump_file) / 1024  # Size in KB
        
        print()
        print("=" * 60)
        print("🎉 DATABASE DUMP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"📁 File: {dump_file.name}")
        print(f"📍 Location: {dump_file.absolute()}")
        print(f"📊 Total documents: {total_documents}")
        print(f"📋 Collections: {len(collections)}")
        print(f"💾 File size: {file_size:.2f} KB")
        print()
        
        # Create detailed summary report
        print("📈 DETAILED COLLECTION SUMMARY:")
        print("-" * 40)
        for collection_name in collections:
            count = len(dump_data["data"][collection_name])
            status = "✅" if count > 0 else "⚠️ "
            print(f"   {status} {collection_name:15} : {count:3d} documents")
        
        print()
        print("🔧 USAGE INSTRUCTIONS:")
        print("-" * 30)
        print("📤 To restore this dump:")
        print(f"   python restore_db_dump.py {dump_file.name}")
        print("📄 To view readable format:")
        print(f"   python view_dump.py {dump_file.name}")
        
        # Create a latest.json symlink/copy for easy access
        latest_file = db_dir / "latest_dump.json"
        try:
            if latest_file.exists():
                latest_file.unlink()
            
            # Copy content to latest file
            with open(latest_file, 'w', encoding='utf-8') as f:
                json.dump(dump_data, f, cls=JSONEncoder, indent=2, ensure_ascii=False)
            print(f"📎 Latest dump also saved as: {latest_file.name}")
        except Exception as e:
            print(f"⚠️  Could not create latest dump copy: {e}")
        
    except Exception as e:
        print(f"❌ Error writing dump file: {e}")
        return False
    
    return True

async def create_readable_summary():
    """Create a human-readable summary for quick inspection"""
    
    db = get_database()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    db_dir = Path("../db")
    summary_file = db_dir / f"db_summary_{timestamp}.txt"
    
    collections = ["users", "jobs", "applications", "profiles"]
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("JOB MATCHING DATABASE SUMMARY\n")
        f.write("=" * 50 + "\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Database: job_matching_db\n\n")
        
        total_docs = 0
        
        for collection_name in collections:
            f.write(f"\n{collection_name.upper()}\n")
            f.write("-" * len(collection_name) + "\n")
            
            try:
                collection = db[collection_name]  
                documents = await collection.find({}).to_list(length=None)
                doc_count = len(documents)
                total_docs += doc_count
                
                f.write(f"Total documents: {doc_count}\n")
                
                if collection_name == "users":
                    roles = {}
                    for doc in documents:
                        role = doc.get("role", "unknown")
                        roles[role] = roles.get(role, 0) + 1
                    f.write("Roles breakdown:\n")
                    for role, count in roles.items():
                        f.write(f"  - {role}: {count}\n")
                
                elif collection_name == "jobs":
                    companies = {}
                    statuses = {}
                    for doc in documents:
                        company = doc.get("company", "unknown")
                        status = doc.get("status", "unknown")
                        companies[company] = companies.get(company, 0) + 1
                        statuses[status] = statuses.get(status, 0) + 1
                    
                    f.write("Companies:\n")
                    for company, count in companies.items():
                        f.write(f"  - {company}: {count} jobs\n")
                    
                    f.write("Status breakdown:\n")
                    for status, count in statuses.items():
                        f.write(f"  - {status}: {count}\n")
                
                elif collection_name == "applications":
                    statuses = {}
                    for doc in documents:
                        status = doc.get("status", "unknown")
                        statuses[status] = statuses.get(status, 0) + 1
                    
                    f.write("Application status:\n")
                    for status, count in statuses.items():
                        f.write(f"  - {status}: {count}\n")
                
                f.write("\n")
                    
            except Exception as e:
                f.write(f"Error reading {collection_name}: {e}\n")
        
        f.write(f"\nTOTAL DATABASE DOCUMENTS: {total_docs}\n")
        f.write(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print(f"📄 Database summary created: {summary_file.name}")

if __name__ == "__main__":
    print("🚀 Starting MongoDB Database Dump")
    print("=" * 50)
    print("🎯 Target: job_matching_db")
    print("📁 Output: ../db/ directory")
    print()
    
    try:
        # Run the dump process
        success = asyncio.run(create_database_dump())
        
        if success:
            # Also create readable summary
            asyncio.run(create_readable_summary())
            
            print("\n✨ DUMP PROCESS COMPLETED SUCCESSFULLY!")
            print("📂 Check the db/ directory for your dump files")
        else:
            print("\n❌ Dump process failed!")
            
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        print("Please check your database connection and try again.")