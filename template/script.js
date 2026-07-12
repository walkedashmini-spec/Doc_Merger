(function () {
  'use strict';

  const MAX_FILES = 10;
  const COUNTDOWN_SECONDS = 300;

  const state = {
    files: [],
    signedUrl: null,
    countdownInterval: null,
    countdownRemaining: COUNTDOWN_SECONDS,
    dragSrcIndex: null,
  };

  const $ = (sel) => document.querySelector(sel);

  const dropZone = $('#drop-zone');
  const fileInput = $('#file-input');
  const fileList = $('#file-list');
  const mergeBtn = $('#merge-btn');
  const uploadSection = $('#upload-section');
  const loadingOverlay = $('#loading-state');
  const successSection = $('#success-section');
  const errorContainer = $('#error-container');
  const countdownEl = $('#countdown');
  const downloadBtn = $('#download-btn');
  const copyBtn = $('#copy-btn');
  const resetBtn = $('#reset-btn');
  const expiredMessage = $('#expired-message');

  /* -- Helpers -- */

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function isPdf(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /* -- Error Cards -- */

  function showError(title, message) {
    const card = document.createElement('div');
    card.className = 'error-card';
    card.innerHTML =
      '<div class="error-card-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' +
        '</svg>' +
      '</div>' +
      '<div class="error-card-content">' +
        '<h4>' + title + '</h4>' +
        '<p>' + message + '</p>' +
      '</div>' +
      '<button class="error-card-close" aria-label="Dismiss">&times;</button>';

    card.querySelector('.error-card-close').addEventListener('click', () => card.remove());
    errorContainer.appendChild(card);

    setTimeout(() => {
      if (card.parentNode) card.remove();
    }, 5000);
  }

  /* -- File Management -- */

  function addFiles(newFiles) {
    const incoming = Array.from(newFiles);
    const nonPdf = incoming.filter((f) => !isPdf(f));
    if (nonPdf.length) {
      showError('Invalid file type', 'Only PDF files are allowed. Please select PDF documents only.');
      return;
    }

    const pdfFiles = incoming.filter(isPdf);
    const total = state.files.length + pdfFiles.length;

    if (total > MAX_FILES) {
      showError('Too many files', 'Maximum 10 files allowed. Please remove some files before adding more.');
      return;
    }

    pdfFiles.forEach((file) => {
      const duplicate = state.files.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!duplicate) state.files.push(file);
    });

    renderFileList();
    updateMergeButton();
  }

  function removeFile(index) {
    state.files.splice(index, 1);
    renderFileList();
    updateMergeButton();
  }

  function updateMergeButton() {
    mergeBtn.disabled = state.files.length < 2;
  }

  function renderFileList() {
    fileList.innerHTML = '';

    if (state.files.length === 0) return;

    const header = document.createElement('div');
    header.className = 'file-list-header';
    header.innerHTML =
      '<span>Selected files (' + state.files.length + '/' + MAX_FILES + ')</span>' +
      '<span>Drag to reorder</span>';
    fileList.appendChild(header);

    state.files.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'file-card';
      card.draggable = true;
      card.dataset.index = index;

      card.innerHTML =
        '<div class="file-card-icon">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>' +
        '</div>' +
        '<div class="file-card-info">' +
          '<div class="file-card-name">' + escapeHtml(file.name) + '</div>' +
          '<div class="file-card-size">' + formatSize(file.size) + '</div>' +
        '</div>' +
        '<div class="file-card-drag">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>' +
        '</div>' +
        '<button class="file-card-remove" aria-label="Remove file" data-index="' + index + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';

      card.addEventListener('dragstart', onCardDragStart);
      card.addEventListener('dragend', onCardDragEnd);
      card.addEventListener('dragover', onCardDragOver);
      card.addEventListener('dragleave', onCardDragLeave);
      card.addEventListener('drop', onCardDrop);

      card.querySelector('.file-card-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(parseInt(e.currentTarget.dataset.index, 10));
      });

      fileList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* -- File Card Reorder -- */

  function onCardDragStart(e) {
    state.dragSrcIndex = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', state.dragSrcIndex);
  }

  function onCardDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.file-card').forEach((c) => c.classList.remove('drag-over-card'));
    state.dragSrcIndex = null;
  }

  function onCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.currentTarget;
    if (card.classList.contains('file-card')) {
      card.classList.add('drag-over-card');
    }
  }

  function onCardDragLeave(e) {
    e.currentTarget.classList.remove('drag-over-card');
  }

  function onCardDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index, 10);
    const srcIndex = state.dragSrcIndex;

    if (srcIndex === null || srcIndex === targetIndex) return;

    const moved = state.files.splice(srcIndex, 1)[0];
    state.files.splice(targetIndex, 0, moved);
    renderFileList();
  }

  /* -- Drop Zone Events -- */

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) addFiles(e.target.files);
    fileInput.value = '';
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  /* -- Merge Flow -- */

  async function mergePdfs() {
    if (state.files.length < 2) return;

    setMergingState(true);

    const formData = new FormData();
    state.files.forEach((file) => formData.append('pdfs', file));

    try {
      const res = await fetch('/merge', { method: 'POST', body: formData });
      const html = await res.text();

      if (!res.ok) {
        showError('Upload failed', 'Something went wrong while merging your PDFs. Please try again.');
        setMergingState(false);
        return;
      }

      const match = html.match(/href="([^"]+)"/);
      if (!match) {
        showError('Something went wrong', 'Could not retrieve the download link. Please try again.');
        setMergingState(false);
        return;
      }

      state.signedUrl = match[1];
      showSuccess();
    } catch (err) {
      showError('Network error', 'Unable to connect to the server. Check your connection and try again.');
      setMergingState(false);
    }
  }

  function setMergingState(active) {
    if (active) {
      uploadSection.classList.add('hidden-section');
      loadingOverlay.classList.add('active');
      mergeBtn.disabled = true;
      mergeBtn.innerHTML = '<span class="btn-spinner"></span> Merging...';
    } else {
      uploadSection.classList.remove('hidden-section');
      loadingOverlay.classList.remove('active');
      mergeBtn.disabled = state.files.length < 2;
      mergeBtn.innerHTML = 'Merge PDFs';
    }
  }

  function showSuccess() {
    loadingOverlay.classList.remove('active');
    successSection.classList.add('active');

    downloadBtn.href = state.signedUrl;
    downloadBtn.classList.remove('btn-expired');
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download PDF';
    copyBtn.disabled = false;
    expiredMessage.classList.remove('active');

    state.countdownRemaining = COUNTDOWN_SECONDS;
    countdownEl.textContent = formatCountdown(state.countdownRemaining);
    countdownEl.classList.remove('expired');

    if (state.countdownInterval) clearInterval(state.countdownInterval);
    state.countdownInterval = setInterval(tickCountdown, 1000);
  }

  function tickCountdown() {
    state.countdownRemaining--;
    countdownEl.textContent = formatCountdown(state.countdownRemaining);

    if (state.countdownRemaining <= 0) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
      countdownEl.textContent = '00:00';
      countdownEl.classList.add('expired');

      downloadBtn.disabled = true;
      downloadBtn.removeAttribute('href');
      downloadBtn.classList.add('btn-expired');
      downloadBtn.textContent = 'Link Expired';
      copyBtn.disabled = true;
      expiredMessage.classList.add('active');
    }
  }

  /* -- Download / Copy / Reset -- */

  copyBtn.addEventListener('click', async () => {
    if (!state.signedUrl || state.countdownRemaining <= 0) return;
    try {
      await navigator.clipboard.writeText(state.signedUrl);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = original; }, 2000);
    } catch {
      showError('Copy failed', 'Unable to copy the link. Please copy it manually from the download button.');
    }
  });

  resetBtn.addEventListener('click', resetApp);

  function resetApp() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }

    state.files = [];
    state.signedUrl = null;
    state.countdownRemaining = COUNTDOWN_SECONDS;

    renderFileList();
    updateMergeButton();

    successSection.classList.remove('active');
    uploadSection.classList.remove('hidden-section');
    loadingOverlay.classList.remove('active');

    mergeBtn.disabled = true;
    mergeBtn.innerHTML = 'Merge PDFs';

    countdownEl.classList.remove('expired');
    expiredMessage.classList.remove('active');
    downloadBtn.classList.remove('btn-expired');
    copyBtn.disabled = false;
    fileInput.value = '';
  }

  mergeBtn.addEventListener('click', mergePdfs);

  /* -- Mobile Nav Toggle -- */

  const navToggle = $('#nav-toggle');
  const navLinks = $('#nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
})();
