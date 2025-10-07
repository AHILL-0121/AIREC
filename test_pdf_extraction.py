import PyPDF2
import os

def test_pdf_extraction(file_path):
    print(f"Testing PDF extraction for: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"File does not exist: {file_path}")
        return
    
    # Check file size
    file_size = os.path.getsize(file_path)
    print(f"File size: {file_size} bytes")
    
    if file_size == 0:
        print("File is empty!")
        return
    
    # Try to extract text
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"Number of pages: {len(pdf_reader.pages)}")
            
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                print(f"Page {i+1} text length: {len(page_text)}")
                text += page_text
                
            print(f"Total extracted text length: {len(text)}")
            if len(text) > 0:
                print(f"First 200 characters: {text[:200]}")
            else:
                print("No text extracted from PDF")
                
            return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

# Test all PDF files in uploads
uploads_dir = "backend/uploads"
if os.path.exists(uploads_dir):
    pdf_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
    print(f"Found {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        file_path = os.path.join(uploads_dir, pdf_file)
        test_pdf_extraction(file_path)
        print("\n" + "="*50 + "\n")
else:
    print(f"Directory does not exist: {uploads_dir}")