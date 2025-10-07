from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_test_resume_pdf():
    """Create a test PDF with resume content"""
    filename = "test_resume.pdf"
    
    # Create the PDF
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Add resume content
    c.drawString(100, height - 100, "JOHN DOE")
    c.drawString(100, height - 130, "Software Engineer")
    c.drawString(100, height - 160, "Email: john.doe@example.com")
    c.drawString(100, height - 190, "Phone: (555) 123-4567")
    
    c.drawString(100, height - 240, "SKILLS:")
    c.drawString(120, height - 270, "- Python, JavaScript, Java")
    c.drawString(120, height - 290, "- React, Node.js, Django")
    c.drawString(120, height - 310, "- AWS, Docker, Kubernetes")
    
    c.drawString(100, height - 360, "EXPERIENCE:")
    c.drawString(120, height - 390, "Senior Software Engineer - Tech Corp (2020-2023)")
    c.drawString(120, height - 410, "- Developed web applications using React and Node.js")
    c.drawString(120, height - 430, "- Led a team of 5 developers")
    c.drawString(120, height - 450, "- Improved system performance by 40%")
    
    c.drawString(100, height - 500, "EDUCATION:")
    c.drawString(120, height - 530, "Bachelor of Science in Computer Science")
    c.drawString(120, height - 550, "University of Technology (2016-2020)")
    
    c.save()
    print(f"Created test resume PDF: {filename}")
    return filename

if __name__ == "__main__":
    create_test_resume_pdf()