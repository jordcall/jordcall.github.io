# Jordan Call Personal Website

## Overview

This is a minimalist, text-first personal website for Jordan Call built as a static HTML/CSS/JavaScript project. The site serves as a digital presence showcasing Jordan's creative work including writing, music, photography, and various personal projects. The design philosophy emphasizes clean typography, generous whitespace, and accessible content presentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Pure HTML5, CSS3, and vanilla JavaScript
- **Design Philosophy**: Minimalist, text-first approach with emphasis on readability and accessibility
- **Layout Strategy**: Single-column, centered content with maximum width constraints for optimal reading experience
- **Responsive Design**: Mobile-first approach with fluid scaling
- **Cache-Busting System**: Automated versioning system prevents stale content issues across deployments

### Typography System
- **Body Text**: Inter font family (400-500 weights) at 16px base size with 1.55 line-height
- **Headings**: Montserrat font family (700 weight) for strong visual hierarchy
- **Content Width**: Maximum 700px centered with generous whitespace
- **Color Scheme**: High contrast black text on white background with dark/light blue accents for links

### Navigation Structure
- **Header Navigation**: Consistent across all pages with site name as home link
- **Page Structure**: 12 total pages (homepage + 11 content pages)
- **URL Strategy**: Simple .html extensions for static hosting compatibility

## Key Components

### Page Architecture
1. **Homepage (index.html)**: Welcome message with hero image and site navigation
2. **Content Pages**: Bio, Now, Kicks, Writing, Music, Blog, Podcasts, Photos, Contact, Subscribe, Wall
3. **Common Elements**: Consistent header/footer, SEO meta tags, social media integration

### Interactive Features
- **Context Window**: Floating informational overlay with dismissal functionality
- **Accessibility**: Focus-visible outlines, semantic HTML structure
- **Progressive Enhancement**: Core functionality works without JavaScript

### Asset Management
- **Images**: Organized in `/assets/images/` with fluid scaling and subtle border radius
- **Image Integrity**: Automated checking prevents broken references and case mismatches
- **Stylesheets**: Single CSS file at `/assets/css/styles.css` with automatic versioning
- **Scripts**: Core JavaScript files with cache-busting version parameters
- **Build System**: Node.js scripts for version stamping, URL rewriting, and deployment validation
- **Fresh Deploys**: Every deployment generates new timestamps preventing stale content

## Data Flow

### Static Content Delivery
- **Architecture**: Client-side only, no server-side processing required
- **Content Strategy**: Hand-crafted HTML with semantic markup
- **Performance**: Optimized fonts with preconnect hints to Google Fonts
- **Caching**: Browser-based caching for static assets

### User Interactions
- **Context Window**: Local storage for user preferences (dismissal state)
- **Navigation**: Standard HTTP requests for page transitions
- **Accessibility**: Keyboard navigation support with escape key handling

## External Dependencies

### Third-Party Services
- **Google Fonts**: Inter and Montserrat font families loaded via CDN
- **SEO Integration**: Open Graph and Twitter Card meta tags for social sharing
- **Analytics**: Prepared for future integration (not currently implemented)

### Browser Support
- **Modern Browsers**: Designed for current evergreen browsers
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: WCAG compliance considerations built into design

## Deployment Strategy

### Static Hosting Requirements
- **Hosting Type**: Any static web hosting service (Netlify, Vercel, GitHub Pages, etc.)
- **Build Process**: No build step required - direct file serving
- **Domain Configuration**: Configured for jordancall.com domain
- **SEO Optimization**: robots.txt file with sitemap reference included

### File Structure
```
/
├── index.html (homepage)
├── [page-name].html (11 content pages)
├── robots.txt
├── /assets/
│   ├── /css/
│   │   └── styles.css
│   ├── /js/
│   │   └── main.js
│   └── /images/
│       ├── top-photo.jpg
│       ├── bottom-photo.jpg
│       └── favicon.ico
```

### Performance Considerations
- **Image Optimization**: Responsive images with appropriate alt text and integrity validation
- **Font Loading**: Preconnect hints for faster font delivery
- **JavaScript**: Minimal vanilla JS for enhanced functionality
- **CSS**: Single stylesheet with mobile-first responsive design
- **Cache-Busting**: Automated versioning prevents browser/CDN caching issues
- **Service Worker Prevention**: Automatic unregistration prevents aggressive caching

The architecture prioritizes simplicity, maintainability, and fast loading times while providing a solid foundation for future enhancements. The design allows for easy content updates and potential migration to a content management system if needed.