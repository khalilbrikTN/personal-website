# Professional Personal Website

A modern, responsive personal website template designed specifically for computer science students and developers. Built with HTML, CSS, and JavaScript, featuring a clean design, smooth animations, and professional presentation.

## 🌟 Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Interactive Elements**: Hover effects, scroll animations, and dynamic content
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Contact Form**: Functional contact form with validation
- **SEO Optimized**: Proper meta tags and semantic HTML structure
- **Accessibility**: WCAG compliant with proper focus states and ARIA labels
- **Performance**: Optimized for fast loading and smooth performance

## 📁 File Structure

```
personal-website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🚀 Quick Start

1. **Clone or Download**: Download the files to your local machine
2. **Customize Content**: Edit the HTML file to personalize your information
3. **Deploy**: Upload to any web hosting service (GitHub Pages, Netlify, Vercel, etc.)

## 🎨 Customization Guide

### Personal Information

Edit the following sections in `index.html`:

#### Hero Section
```html
<!-- Replace "Your Name" with your actual name -->
<h1 class="hero-title">
    Hi, I'm <span class="highlight">Your Name</span>
</h1>
<h2 class="hero-subtitle">Computer Science Student & Developer</h2>
```

#### About Section
```html
<!-- Update your personal story and university -->
<p>Currently, I'm pursuing my degree in Computer Science at [Your University]</p>
```

#### Contact Information
```html
<!-- Update contact details -->
<div class="contact-item">
    <i class="fas fa-envelope"></i>
    <span>your.email@example.com</span>
</div>
<div class="contact-item">
    <i class="fas fa-map-marker-alt"></i>
    <span>Your City, Country</span>
</div>
<div class="contact-item">
    <i class="fas fa-phone"></i>
    <span>+1 (555) 123-4567</span>
</div>
```

### Projects Section

Replace the sample projects with your own:

```html
<div class="project-card">
    <div class="project-image">
        <i class="fas fa-code"></i> <!-- Choose appropriate icon -->
    </div>
    <div class="project-content">
        <h3>Your Project Name</h3>
        <p>Description of your project...</p>
        <div class="project-tech">
            <span class="tech-tag">Technology 1</span>
            <span class="tech-tag">Technology 2</span>
        </div>
        <div class="project-links">
            <a href="your-github-link" class="project-link">
                <i class="fab fa-github"></i> Code
            </a>
            <a href="your-live-link" class="project-link">
                <i class="fas fa-external-link-alt"></i> Live
            </a>
        </div>
    </div>
</div>
```

### Skills Section

Update your skills and technologies:

```html
<div class="skill-item">
    <i class="fab fa-python"></i> <!-- Choose appropriate FontAwesome icon -->
    <span>Python</span>
</div>
```

### Social Links

Update the footer social links:

```html
<div class="footer-social">
    <a href="your-github" class="social-link"><i class="fab fa-github"></i></a>
    <a href="your-linkedin" class="social-link"><i class="fab fa-linkedin"></i></a>
    <a href="your-twitter" class="social-link"><i class="fab fa-twitter"></i></a>
    <a href="your-instagram" class="social-link"><i class="fab fa-instagram"></i></a>
</div>
```

## 🎯 Color Scheme

The website uses a modern color palette:

- **Primary**: `#667eea` (Blue)
- **Secondary**: `#764ba2` (Purple)
- **Text**: `#2d3748` (Dark Gray)
- **Background**: `#ffffff` (White)
- **Light Background**: `#f7fafc` (Light Gray)

To change colors, edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #2d3748;
    --background-color: #ffffff;
    --light-background: #f7fafc;
}
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Advanced Customization

### Adding New Sections

1. Add the HTML structure in `index.html`
2. Add corresponding CSS styles in `styles.css`
3. Add any JavaScript functionality in `script.js`

### Custom Animations

The website includes several animations:
- Fade-in effects on scroll
- Hover animations on cards
- Typing animation for the hero title
- Counter animations for statistics

### Form Integration

The contact form currently shows a success message. To integrate with a backend:

1. Replace the form submission handler in `script.js`
2. Add your backend endpoint
3. Handle form data appropriately

## 🌐 Deployment Options

### GitHub Pages
1. Create a new repository
2. Upload your files
3. Go to Settings > Pages
4. Select source branch and save

### Netlify
1. Drag and drop your folder to Netlify
2. Or connect your GitHub repository
3. Automatic deployment on push

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts

## 📊 Performance Optimization

- Images are optimized and use appropriate formats
- CSS and JavaScript are minified for production
- Font Awesome icons are loaded from CDN
- Google Fonts are preloaded for better performance

## 🔍 SEO Features

- Semantic HTML structure
- Meta tags for description and keywords
- Open Graph tags for social sharing
- Proper heading hierarchy
- Alt text for images

## 🛠️ Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Internet Explorer 11+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📞 Support

If you need help customizing or deploying your website, feel free to reach out!

---

**Made with ❤️ for Computer Science Students** 