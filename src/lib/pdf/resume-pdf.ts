'use client';

/**
 * Resume PDF Generator
 * 
 * Generates a professional PDF resume by creating a print-ready HTML document
 * and triggering the browser's print-to-PDF functionality.
 * 
 * No external dependencies needed — uses the browser's native print API.
 */

export interface ResumeData {
  title: string;
  summary: string;
  displayName: string;
  email: string;
  city?: string;
  experience: {
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate and trigger PDF download for a resume
 */
export function generateResumePDF(data: ResumeData): void {
  const html = buildResumeHTML(data);

  // Open a new window with the resume content and trigger print
  const printWindow = window.open('', '_blank', 'width=800,height=1100');
  if (!printWindow) {
    alert('Please allow popups to export your resume as PDF.');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Give the browser a moment to render, then print
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function buildResumeHTML(data: ResumeData): string {
  const experienceHTML = data.experience.length > 0
    ? `
      <section class="section">
        <h2>Experience</h2>
        ${data.experience.map(exp => `
          <div class="entry">
            <div class="entry-header">
              <div>
                <strong>${escapeHtml(exp.jobTitle)}</strong>
                <span class="company">${escapeHtml(exp.company)}</span>
              </div>
              <span class="date">${escapeHtml(exp.startDate)} — ${exp.endDate || 'Present'}</span>
            </div>
            ${exp.bullets.length > 0 ? `
              <ul>
                ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `
    : '';

  const educationHTML = data.education.length > 0
    ? `
      <section class="section">
        <h2>Education</h2>
        ${data.education.map(edu => `
          <div class="entry">
            <div class="entry-header">
              <div>
                <strong>${escapeHtml(edu.degree)}</strong>
                <span class="company">${escapeHtml(edu.school)}</span>
              </div>
              <span class="date">${escapeHtml(edu.year)}</span>
            </div>
          </div>
        `).join('')}
      </section>
    `
    : '';

  const skillsHTML = data.skills.length > 0
    ? `
      <section class="section">
        <h2>Skills</h2>
        <div class="skills">
          ${data.skills.map(s => `<span class="skill">${escapeHtml(s)}</span>`).join('')}
        </div>
      </section>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.displayName)} — Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 0.75in;
      max-width: 8.5in;
      margin: 0 auto;
    }

    @media print {
      body { padding: 0; }
      @page { margin: 0.6in; size: letter; }
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #1e3a6e;
    }

    .header h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #1e3a6e;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }

    .header .title {
      font-size: 12pt;
      color: #4a5568;
      margin-bottom: 6px;
    }

    .header .contact {
      font-size: 9pt;
      color: #718096;
    }

    .header .contact span {
      margin: 0 8px;
    }

    .summary {
      font-size: 10pt;
      color: #4a5568;
      margin-bottom: 20px;
      line-height: 1.6;
      text-align: center;
      font-style: italic;
    }

    .section {
      margin-bottom: 18px;
    }

    .section h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e3a6e;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }

    .entry {
      margin-bottom: 12px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .entry-header strong {
      font-size: 11pt;
      color: #1a1a1a;
    }

    .company {
      color: #4a5568;
      margin-left: 8px;
    }

    .date {
      font-size: 9pt;
      color: #718096;
      white-space: nowrap;
    }

    ul {
      margin-left: 18px;
      margin-top: 4px;
    }

    li {
      font-size: 10pt;
      color: #2d3748;
      margin-bottom: 2px;
    }

    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill {
      font-size: 9pt;
      background: #edf2f7;
      color: #2d3748;
      padding: 3px 10px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 8pt;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.displayName)}</h1>
    ${data.title ? `<div class="title">${escapeHtml(data.title)}</div>` : ''}
    <div class="contact">
      <span>${escapeHtml(data.email)}</span>
      ${data.city ? `<span>·</span><span>${escapeHtml(data.city)}</span>` : ''}
    </div>
  </div>

  ${data.summary ? `<div class="summary">${escapeHtml(data.summary)}</div>` : ''}

  ${experienceHTML}
  ${educationHTML}
  ${skillsHTML}

  <div class="footer">
    Generated with MiLyfe · milyfe.fun
  </div>
</body>
</html>`;
}
