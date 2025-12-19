document.addEventListener('DOMContentLoaded', function() {
  initNowArchive();
});

function initNowArchive() {
  const expandAllBtn = document.getElementById('expand-all-btn');
  const collapseAllBtn = document.getElementById('collapse-all-btn');
  
  if (!expandAllBtn || !collapseAllBtn) return;
  
  expandAllBtn.addEventListener('click', expandAllEntries);
  collapseAllBtn.addEventListener('click', collapseAllEntries);
  
  document.addEventListener('keydown', handleGlobalKeydown);
  
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      const targetEntry = document.getElementById(targetId);
      if (targetEntry) {
        const button = targetEntry.querySelector('.archive-entry-toggle');
        if (button && button.getAttribute('aria-expanded') === 'false') {
          toggleEntry(button);
        }
      }
    }, 100);
  }
}

function createArchiveEntry(date, preview, content) {
  const entryId = `now-${date}`;
  const contentId = `${entryId}-content`;
  
  const entry = document.createElement('div');
  entry.className = 'archive-entry';
  entry.id = entryId;
  
  const button = document.createElement('button');
  button.className = 'archive-entry-toggle';
  button.setAttribute('type', 'button');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', contentId);
  
  const header = document.createElement('span');
  header.className = 'archive-entry-header';
  header.innerHTML = `<strong>${date}</strong> ${preview}`;
  
  button.appendChild(header);
  
  button.addEventListener('click', () => toggleEntry(button));
  button.addEventListener('keydown', (e) => handleEntryKeydown(e, button));
  
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'archive-entry-content';
  contentWrapper.id = contentId;
  contentWrapper.setAttribute('hidden', '');
  contentWrapper.innerHTML = content;
  
  const permalink = document.createElement('a');
  permalink.href = `#${entryId}`;
  permalink.className = 'archive-permalink';
  permalink.textContent = 'Permalink';
  permalink.setAttribute('aria-label', `Permalink to ${date} entry`);
  contentWrapper.appendChild(permalink);
  
  const snapshotLink = document.createElement('p');
  snapshotLink.className = 'archive-snapshot-link';
  snapshotLink.innerHTML = `<a href="/now/${date}.html">View standalone page</a>`;
  contentWrapper.appendChild(snapshotLink);
  
  entry.appendChild(button);
  entry.appendChild(contentWrapper);
  
  return entry;
}

function toggleEntry(button) {
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  const contentId = button.getAttribute('aria-controls');
  const content = document.getElementById(contentId);
  
  if (!content) return;
  
  if (isExpanded) {
    button.setAttribute('aria-expanded', 'false');
    content.setAttribute('hidden', '');
    button.classList.remove('expanded');
  } else {
    button.setAttribute('aria-expanded', 'true');
    content.removeAttribute('hidden');
    button.classList.add('expanded');
  }
}

function handleEntryKeydown(e, button) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      toggleEntry(button);
      break;
      
    case 'Escape':
      e.preventDefault();
      if (button.getAttribute('aria-expanded') === 'true') {
        toggleEntry(button);
        button.focus();
      }
      break;
      
    case 'ArrowDown':
      e.preventDefault();
      focusNextEntry(button);
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      focusPrevEntry(button);
      break;
  }
}

function focusNextEntry(currentButton) {
  const allButtons = Array.from(document.querySelectorAll('.archive-entry-toggle'));
  const currentIndex = allButtons.indexOf(currentButton);
  const nextButton = allButtons[currentIndex + 1];
  if (nextButton) {
    nextButton.focus();
  }
}

function focusPrevEntry(currentButton) {
  const allButtons = Array.from(document.querySelectorAll('.archive-entry-toggle'));
  const currentIndex = allButtons.indexOf(currentButton);
  const prevButton = allButtons[currentIndex - 1];
  if (prevButton) {
    prevButton.focus();
  }
}

function expandAllEntries() {
  const buttons = document.querySelectorAll('.archive-entry-toggle');
  buttons.forEach(button => {
    if (button.getAttribute('aria-expanded') === 'false') {
      toggleEntry(button);
    }
  });
}

function collapseAllEntries() {
  const buttons = document.querySelectorAll('.archive-entry-toggle');
  buttons.forEach(button => {
    if (button.getAttribute('aria-expanded') === 'true') {
      toggleEntry(button);
    }
  });
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    collapseAllEntries();
  }
}

if (typeof window !== 'undefined') {
  window.createArchiveEntry = createArchiveEntry;
}
