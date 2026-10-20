# =============================================================================
# EduTrack 3D — Sample PDF Rubric Generator (generate_sample_pdf.py)
# =============================================================================
# Generates realistic academic assignment PDFs for Feature F6 (Smart OCR).
# Creates standard course assignment rubrics with course code, title, and due date.
# =============================================================================

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_assignment_pdf(filename="sample_assignment_rubric.pdf"):
    output_dir = os.path.join(os.path.dirname(__file__), "sample_rubrics")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#090D16'),
        alignment=1, # Center
        spaceAfter=14
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4F46E5')
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Title
    story.append(Paragraph("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", header_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Assignment Rubric & Specification", title_style))
    story.append(Spacer(1, 10))

    # Structured metadata block (OCR target fields)
    metadata_data = [
        [Paragraph("<b>Course Code:</b>", body_style), Paragraph("CS201", body_style)],
        [Paragraph("<b>Course Name:</b>", body_style), Paragraph("Data Structures & Algorithms", body_style)],
        [Paragraph("<b>Assignment Title:</b>", body_style), Paragraph("Assignment 4 - Red-Black Tree Implementation", body_style)],
        [Paragraph("<b>Submission Deadline:</b>", body_style), Paragraph("2024-12-05 23:59:00", body_style)],
        [Paragraph("<b>Maximum Marks:</b>", body_style), Paragraph("100 Marks", body_style)],
        [Paragraph("<b>Instructor:</b>", body_style), Paragraph("Dr. Meena Iyer", body_style)],
    ]

    table = Table(metadata_data, colWidths=[150, 350])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))

    # Problem Statement
    story.append(Paragraph("<b>1. Objective & Problem Statement</b>", header_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Students are required to implement a self-balancing Red-Black Search Tree in C++ or Java. "
        "The implementation must support node insertion, deletion, left/right rotations, color flips, "
        "and verification of tree properties. Benchmark time complexity against unbalanced BSTs.",
        body_style
    ))
    story.append(Spacer(1, 14))

    # Grading Rubric
    story.append(Paragraph("<b>2. Evaluation Criteria & Marking Rubric</b>", header_style))
    story.append(Spacer(1, 6))

    rubric_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Description</b>", body_style), Paragraph("<b>Marks</b>", body_style)],
        [Paragraph("Node Insertion & Rotations", body_style), Paragraph("Correct tree rebalancing with left and right rotations.", body_style), Paragraph("30%", body_style)],
        [Paragraph("Node Deletion & Fixup", body_style), Paragraph("Handling double-black conditions and coloring fixes.", body_style), Paragraph("30%", body_style)],
        [Paragraph("Performance Benchmarking", body_style), Paragraph("Empirical time complexity graphs for N=10,000 nodes.", body_style), Paragraph("20%", body_style)],
        [Paragraph("Code Quality & Tests", body_style), Paragraph("Clean modular architecture and unit test suite.", body_style), Paragraph("20%", body_style)],
    ]

    rubric_table = Table(rubric_data, colWidths=[140, 290, 70])
    rubric_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(rubric_table)
    story.append(Spacer(1, 20))

    # Submission Instructions
    story.append(Paragraph("<b>3. Submission Guidelines</b>", header_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Upload a compressed ZIP archive containing source code, README, and PDF benchmark report. "
        "Strict penalty applies for late submissions. Academic integrity and plagiarism policies are strictly enforced.",
        body_style
    ))

    doc.build(story)
    print(f"[OK] Generated sample assignment PDF: {filepath}")
    return filepath

if __name__ == "__main__":
    generate_assignment_pdf()
