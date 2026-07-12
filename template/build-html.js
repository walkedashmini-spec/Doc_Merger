const fs = require('fs');
const path = require('path');

const dir = __dirname;
const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'script.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Merger</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>

  <nav class="navbar">
    <a href="#hero" class="navbar-brand"><span>&#128196;</span> PDF Merger</a>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">&#9776;</button>
    <ul class="nav-links" id="nav-links">
      <li><a href="#hero">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#" target="_blank" rel="noopener">GitHub</a></li>
    </ul>
  </nav>

  <div id="error-container" class="error-container"></div>

  <main class="container">
    <section class="hero" id="hero">
      <h1>Merge PDF Files</h1>
      <p>Combine multiple PDF documents into one file in seconds.</p>
    </section>

    <section class="card" id="main-card">
      <div id="upload-section" class="upload-section">
        <div class="drop-zone" id="drop-zone">
          <div class="drop-zone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h3>Drag &amp; drop your PDFs here</h3>
          <p>or <span class="browse-link">click to browse</span> &mdash; up to 10 files</p>
          <input type="file" id="file-input" name="pdfs" multiple accept=".pdf,application/pdf">
        </div>

        <div class="file-list" id="file-list"></div>

        <button class="btn btn-primary" id="merge-btn" disabled>Merge PDFs</button>
      </div>

      <div class="loading-overlay" id="loading-state">
        <h3>Merging your PDFs...</h3>
        <div class="progress-bar-track">
          <div class="progress-bar-fill"></div>
        </div>
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="success-section" id="success-section">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Your PDF is Ready!</h2>
        <p class="success-message">Your merged PDF has been successfully generated.</p>
        <div class="expiry-badge">&#9201; This download link expires in 5 minutes</div>
        <div class="countdown" id="countdown">05:00</div>

        <div class="download-card">
          <div class="download-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
          </div>
          <div class="download-card-info">
            <h4>Secure Download Link</h4>
            <p>Your merged PDF is ready for download</p>
          </div>
        </div>

        <div class="download-actions">
          <a class="btn btn-success" id="download-btn" href="#" target="_blank" rel="noopener">Download PDF</a>
          <button class="btn btn-secondary" id="copy-btn">Copy Link</button>
        </div>

        <p class="expired-message" id="expired-message">This temporary download link has expired. Please merge your PDFs again.</p>

        <button class="btn btn-secondary" id="reset-btn" style="width:100%">Merge Another PDF</button>
      </div>
    </section>

    <section class="about" id="about">
      <h2>About PDF Merger</h2>
      <p>A fast, secure tool to combine multiple PDF documents into a single file. Upload up to 10 PDFs, arrange them in order, and download your merged document instantly.</p>
    </section>
  </main>

  <footer class="footer">
    Made with &#10084;&#65039; using Node.js, Express &amp; AWS S3
  </footer>

  <script>
${js}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('index.html built successfully');
