document.addEventListener('DOMContentLoaded', function() {
  initPhotosLightbox();
});

function initPhotosLightbox() {
  const photoItems = document.querySelectorAll('.photo-item');
  
  if (photoItems.length === 0) return;
  
  const modalHTML = `
    <div id="photo-lightbox" class="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Photo viewer" hidden>
      <div class="lightbox-container">
        <button type="button" class="lightbox-close" aria-label="Close photo viewer">
          <span aria-hidden="true">&times;</span>
        </button>
        <button type="button" class="lightbox-prev" aria-label="Previous photo">&lsaquo;</button>
        <button type="button" class="lightbox-next" aria-label="Next photo">&rsaquo;</button>
        <div class="lightbox-content">
          <img id="lightbox-img" src="" alt="" />
          <div class="lightbox-caption"></div>
          <div class="lightbox-counter" aria-live="polite"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const lightboxPrev = lightbox.querySelector('.lightbox-prev');
  const lightboxNext = lightbox.querySelector('.lightbox-next');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  
  let currentIndex = 0;
  let triggerElement = null;
  const photos = Array.from(photoItems);
  const focusableElements = [lightboxClose, lightboxPrev, lightboxNext];
  
  photoItems.forEach((item, index) => {
    item.dataset.index = index;
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      triggerElement = item;
      openLightbox(index);
    });
  });
  
  function openLightbox(index) {
    currentIndex = index;
    const photo = photos[index];
    const fullSrc = photo.href;
    const thumb = photo.querySelector('img');
    
    lightboxImg.src = thumb.src;
    lightboxImg.alt = thumb.alt || `Photo ${index + 1}`;
    
    const img = new Image();
    img.onload = () => {
      lightboxImg.src = img.src;
    };
    img.src = fullSrc;
    
    updateUI();
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
    
    preloadNeighbors();
  }
  
  function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (triggerElement) {
      triggerElement.focus();
      triggerElement = null;
    }
  }
  
  function showPhoto(index) {
    if (index < 0 || index >= photos.length) return;
    
    currentIndex = index;
    const photo = photos[index];
    const fullSrc = photo.href;
    const thumb = photo.querySelector('img');
    
    lightboxImg.src = thumb.src;
    
    const img = new Image();
    img.onload = () => {
      lightboxImg.src = img.src;
    };
    img.src = fullSrc;
    
    lightboxImg.alt = thumb.alt || `Photo ${index + 1}`;
    
    updateUI();
    preloadNeighbors();
  }
  
  function updateUI() {
    lightboxCounter.textContent = `${currentIndex + 1} of ${photos.length}`;
    
    if (currentIndex === 0) {
      lightboxPrev.disabled = true;
      lightboxPrev.setAttribute('aria-disabled', 'true');
    } else {
      lightboxPrev.disabled = false;
      lightboxPrev.setAttribute('aria-disabled', 'false');
    }
    
    if (currentIndex === photos.length - 1) {
      lightboxNext.disabled = true;
      lightboxNext.setAttribute('aria-disabled', 'true');
    } else {
      lightboxNext.disabled = false;
      lightboxNext.setAttribute('aria-disabled', 'false');
    }
  }
  
  function preloadNeighbors() {
    if (currentIndex > 0) {
      const prevPhoto = photos[currentIndex - 1];
      const prevImg = new Image();
      prevImg.src = prevPhoto.href;
    }
    
    if (currentIndex < photos.length - 1) {
      const nextPhoto = photos[currentIndex + 1];
      const nextImg = new Image();
      nextImg.src = nextPhoto.href;
    }
  }
  
  function nextPhoto() {
    if (currentIndex < photos.length - 1) {
      showPhoto(currentIndex + 1);
    }
  }
  
  function prevPhoto() {
    if (currentIndex > 0) {
      showPhoto(currentIndex - 1);
    }
  }
  
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextPhoto);
  lightboxPrev.addEventListener('click', prevPhoto);
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (lightbox.hasAttribute('hidden')) return;
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeLightbox();
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        prevPhoto();
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        nextPhoto();
        break;
        
      case 'Tab':
        e.preventDefault();
        const currentFocus = document.activeElement;
        const currentFocusIndex = focusableElements.indexOf(currentFocus);
        
        if (e.shiftKey) {
          const prevIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
          focusableElements[prevIndex].focus();
        } else {
          const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
          focusableElements[nextIndex].focus();
        }
        break;
    }
  });
}

if (typeof window !== 'undefined') {
  window.initPhotosLightbox = initPhotosLightbox;
}
