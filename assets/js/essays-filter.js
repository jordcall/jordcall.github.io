document.addEventListener('DOMContentLoaded', function() {
  initEssaysFilter();
});

function initEssaysFilter() {
  const filterContainer = document.getElementById('essay-tags-filter');
  const essaysContainer = document.getElementById('essays-by-year');
  
  if (!filterContainer || !essaysContainer) return;
  
  let activeTags = new Set();
  
  const tagButtons = filterContainer.querySelectorAll('.tag-filter-btn');
  
  tagButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag;
      
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
      } else {
        activeTags.add(tag);
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      }
      
      filterEssays();
    });
  });
  
  function filterEssays() {
    const yearSections = essaysContainer.querySelectorAll('.year-section');
    
    yearSections.forEach(section => {
      const postItems = section.querySelectorAll('li');
      let visibleCount = 0;
      
      if (activeTags.size === 0) {
        // No filter active - show all posts
        postItems.forEach(item => {
          item.style.display = '';
          visibleCount++;
        });
      } else {
        // Filter active - check each post
        postItems.forEach(item => {
          const itemTags = item.dataset.tags ? item.dataset.tags.split(',') : [];
          const hasMatchingTag = itemTags.some(tag => activeTags.has(tag.trim()));
          
          if (hasMatchingTag) {
            item.style.display = '';
            visibleCount++;
          } else {
            item.style.display = 'none';
          }
        });
      }
      
      // Auto-hide year section if no visible posts
      // Auto-show year section if it has visible posts (even if collapsed by default)
      const yearList = section.querySelector('.essay-list');
      const yearHeader = section.querySelector('.year-header');
      
      if (visibleCount === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = '';
        
        // If filtering is active and section was collapsed, expand it to show results
        if (activeTags.size > 0 && section.classList.contains('collapsed')) {
          section.classList.remove('collapsed');
          yearList.style.display = '';
          if (yearHeader) {
            yearHeader.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.initEssaysFilter = initEssaysFilter;
}
