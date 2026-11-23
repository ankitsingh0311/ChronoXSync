import os
import subprocess
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(PROJECT_ROOT, "docs", "images")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

MD_FILES = [
    "01_PROJECT_IDEA_AND_PROBLEM_STATEMENT.md",
    "02_SYSTEM_DESIGN_AND_FLOWCHARTS.md",
    "03_IMPLEMENTATION_AND_TECH_STACK.md",
    "04_FUNCTIONALITY_AND_MODULE_DEMO.md",
    "05_CODE_QUALITY_AND_ARCHITECTURE.md",
    "06_PROJECT_REPORT_AND_USER_MANUAL.md",
    "07_VIVA_VOCE_QUESTION_BANK_AND_ANSWERS.md"
]

def markdown_to_html(md_text):
    # Escape basic HTML
    lines = md_text.split('\n')
    html_lines = []
    in_code_block = False
    in_table = False
    table_headers_done = False
    
    for line in lines:
        # Code block
        if line.strip().startswith('```'):
            if in_code_block:
                html_lines.append('</code></pre>')
                in_code_block = False
            else:
                lang = line.strip()[3:].strip()
                html_lines.append(f'<pre><code class="language-{lang}">')
                in_code_block = True
            continue
            
        if in_code_block:
            safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            html_lines.append(safe_line)
            continue
            
        # Tables
        if '|' in line and not line.strip().startswith('```'):
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if all(re.match(r'^:?-+:?$', p) for p in parts if p):
                table_headers_done = True
                continue
            if not in_table:
                html_lines.append('<div class="table-container"><table>')
                in_table = True
                table_headers_done = False
                
            tag = 'th' if not table_headers_done else 'td'
            row_html = '<tr>' + ''.join(f'<{tag}>{p}</{tag}>' for p in parts) + '</tr>'
            html_lines.append(row_html)
            continue
        else:
            if in_table:
                html_lines.append('</table></div>')
                in_table = False
                table_headers_done = False

        # Empty lines
        if not line.strip():
            html_lines.append('<div class="spacer"></div>')
            continue

        # Headers
        if line.startswith('# '):
            html_lines.append(f'<h1 class="section-title">{line[2:]}</h1>')
            continue
        elif line.startswith('## '):
            html_lines.append(f'<h2>{line[3:]}</h2>')
            continue
        elif line.startswith('### '):
            html_lines.append(f'<h3>{line[4:]}</h3>')
            continue
        elif line.startswith('#### '):
            html_lines.append(f'<h4>{line[5:]}</h4>')
            continue

        # Horizontal Rule
        if line.strip() in ['---', '***', '___']:
            html_lines.append('<hr />')
            continue

        # Bullet points
        if line.strip().startswith('* ') or line.strip().startswith('- '):
            item_text = line.strip()[2:]
            # Formats
            item_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', item_text)
            item_text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', item_text)
            item_text = re.sub(r'`(.+?)`', r'<code>\1</code>', item_text)
            html_lines.append(f'<li>{item_text}</li>')
            continue

        # Numbered list
        num_match = re.match(r'^\s*(\d+)\.\s+(.*)', line)
        if num_match:
            item_text = num_match.group(2)
            item_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', item_text)
            item_text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', item_text)
            item_text = re.sub(r'`(.+?)`', r'<code>\1</code>', item_text)
            html_lines.append(f'<div class="numbered-item"><strong>{num_match.group(1)}.</strong> {item_text}</div>')
            continue

        # Standard paragraph formatting
        p_text = line
        p_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p_text)
        p_text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', p_text)
        p_text = re.sub(r'`(.+?)`', r'<code>\1</code>', p_text)
        p_text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', p_text)
        html_lines.append(f'<p>{p_text}</p>')

    if in_table:
        html_lines.append('</table></div>')

    return '\n'.join(html_lines)

def build_dossier():
    print("[*] Generating Comprehensive Viva Master Dossier...")
    combined_content = []

    for md_file in MD_FILES:
        path = os.path.join(SCRIPT_DIR, md_file)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                raw_text = f.read()
                html = markdown_to_html(raw_text)
                combined_content.append(f'<section class="dossier-section">{html}</section>')
        else:
            print(f"[!] Warning: Missing {md_file}")

    body_html = '\n<div class="page-break"></div>\n'.join(combined_content)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ChronoXSync — Viva Voce Master Dossier & Technical Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  
  :root {{
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --accent: #f54e00;
    --bg-page: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --border-strong: #cbd5e1;
    --code-bg: #f8fafc;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    background: #f1f5f9;
    color: var(--text-primary);
    line-height: 1.6;
    padding: 30px 20px;
  }}

  .dossier-wrapper {{
    max-width: 960px;
    margin: 0 auto;
    background: var(--bg-page);
    padding: 50px 60px;
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 4px 25px rgba(0,0,0,0.06);
  }}

  /* Floating Print Button */
  .floating-print-btn {{
    position: fixed;
    bottom: 25px;
    right: 25px;
    background: linear-gradient(135deg, #f54e00 0%, #2563eb 100%);
    color: #ffffff;
    border: none;
    padding: 12px 22px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    transition: transform 0.15s ease;
  }}
  .floating-print-btn:hover {{
    transform: translateY(-2px);
  }}

  .cover-header {{
    text-align: center;
    padding-bottom: 35px;
    margin-bottom: 40px;
    border-bottom: 2px solid var(--border);
  }}

  .cover-badge {{
    display: inline-block;
    background: #eff6ff;
    color: var(--primary);
    border: 1px solid #bfdbfe;
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 15px;
  }}

  .cover-title {{
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
    margin-bottom: 8px;
  }}

  .cover-subtitle {{
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 680px;
    margin: 0 auto 18px auto;
  }}

  .cover-meta {{
    font-size: 13px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }}

  h1.section-title {{
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    border-left: 4px solid var(--accent);
    padding-left: 14px;
    margin: 35px 0 20px 0;
    letter-spacing: -0.01em;
  }}

  h2 {{
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 25px 0 12px 0;
  }}

  h3 {{
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    margin: 18px 0 8px 0;
  }}

  p {{
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }}

  li {{
    font-size: 14px;
    color: var(--text-secondary);
    margin-left: 24px;
    margin-bottom: 6px;
  }}

  .numbered-item {{
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    padding-left: 6px;
  }}

  pre {{
    background: #090d16;
    color: #e2e8f0;
    padding: 14px 18px;
    border-radius: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    overflow-x: auto;
    margin: 14px 0 18px 0;
    line-height: 1.5;
  }}

  code {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    background: var(--code-bg);
    color: #f54e00;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--border);
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }}

  .table-container {{
    overflow-x: auto;
    margin: 18px 0;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }}

  th, td {{
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }}

  th {{
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
  }}

  td {{
    color: var(--text-secondary);
  }}

  hr {{
    border: none;
    border-top: 1px solid var(--border);
    margin: 30px 0;
  }}

  .spacer {{
    height: 8px;
  }}

  @media print {{
    body {{
      background: #ffffff;
      padding: 0;
    }}
    .dossier-wrapper {{
      box-shadow: none;
      border: none;
      padding: 0;
      max-width: 100%;
    }}
    .floating-print-btn {{
      display: none !important;
    }}
    .page-break {{
      page-break-before: always;
      break-before: page;
    }}
    pre {{
      background: #f8fafc !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1 !important;
    }}
  }}
</style>
</head>
<body>

<button class="floating-print-btn" onclick="window.print()">
  🖨️ Download / Print Complete PDF
</button>

<div class="dossier-wrapper">
  <header class="cover-header">
    <div class="cover-badge">Academic Defense Master Dossier</div>
    <h1 class="cover-title">⚡ ChronoXSync</h1>
    <p class="cover-subtitle">
      Autonomous Academic Workload Synchronizer &amp; Multi-Department Governance Engine
    </p>
    <div class="cover-meta">
      Author: Ankit Singh &amp; Krishna Kumar &bull; Higher Education Operating System &bull; 2026
    </div>
  </header>

  {body_html}
</div>

</body>
</html>"""

    html_path = os.path.join(SCRIPT_DIR, "ChronoXSync_Viva_Voce_Master_Dossier.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"[✓] Saved HTML Dossier: {html_path} ({os.path.getsize(html_path)} bytes)")

    # 3. Compile to PDF using headless Chrome
    pdf_path = os.path.join(SCRIPT_DIR, "ChronoXSync_Viva_Voce_Master_Dossier.pdf")
    print(f"[*] Rendering PDF via Headless Chrome: {pdf_path} ...")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    subprocess.run(cmd, capture_output=True)

    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) // 1024
        print(f"[✓] Successfully generated Master PDF: {pdf_path} ({size_kb} KB)")
    else:
        print("[!] Error generating PDF with Chrome.")

if __name__ == "__main__":
    build_dossier()
