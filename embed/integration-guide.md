# Holiday Light Mockup Tool V.2 - Integration Guide

## Overview
The Holiday Light Mockup Tool V.2 is a standalone, embeddable web application that allows customers to visualize holiday lights on their home photos. This version is designed to be easily integrated into your existing website.

## Files Included
- `holiday-light-mockup-v2.html` - Complete standalone tool

## Integration Options

### Option 1: Iframe Embed (Recommended)
The easiest way to integrate the tool into your website:

```html
<!-- Add this button to your Holiday Light page -->
<button id="open-mockup-tool" class="btn btn-primary">
    Try Our Light Mockup Tool V.2
</button>

<!-- Modal container -->
<div id="mockup-modal" class="modal" style="display: none;">
    <div class="modal-content" style="width: 95vw; height: 95vh;">
        <span class="close" id="close-mockup">&times;</span>
        <iframe 
            src="/path/to/holiday-light-mockup-v2.html" 
            width="100%" 
            height="100%" 
            frameborder="0">
        </iframe>
    </div>
</div>

<script>
document.getElementById('open-mockup-tool').onclick = function() {
    document.getElementById('mockup-modal').style.display = 'block';
};

document.getElementById('close-mockup').onclick = function() {
    document.getElementById('mockup-modal').style.display = 'none';
};
</script>
```

### Option 2: New Page/Tab
Simply link to the tool as a separate page:

```html
<a href="/holiday-light-mockup-v2.html" target="_blank" class="btn btn-primary">
    Try Our Light Mockup Tool V.2
</a>
```

### Option 3: Direct Integration
If you want to embed the tool directly into your page, you can extract the content from the HTML file and integrate it into your existing page structure.

## Features

### Core Functionality
- **Photo Upload**: Customers can upload photos of their homes
- **String Light Drawing**: Click-to-draw light strings with realistic bulb placement
- **Mini Light Areas**: Shift+drag to create areas filled with mini lights
- **8 Light Patterns**: Warm White, Cool White, Multi-Color, Candy Cane, Icicle, Blue, Halloween, Orange
- **Customizable Settings**: Bulb spacing, brightness, mini light density and size
- **Before/After Toggle**: Compare original photo with light mockup
- **Undo/Redo**: Full history management
- **Export**: Download the final mockup image

### Professional Features
- **Realistic Lighting**: Professional dusk filter and realistic bulb rendering
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Controls**: Easy-to-use interface with clear instructions
- **Visual Feedback**: Real-time preview and status indicators

## Customization

### Branding
You can customize the tool's appearance by modifying the CSS in the HTML file:

```css
/* Change the header colors */
.mockup-container header {
    background-color: your-brand-color;
}

/* Update the primary accent color */
.text-green-400 {
    color: your-accent-color !important;
}

.bg-green-600 {
    background-color: your-button-color !important;
}
```

### Title and Text
Update the title and description in the HTML:

```html
<h1 class="text-2xl font-bold text-green-400">Your Company - Holiday Light Mockup Tool</h1>
<p class="text-gray-300 text-sm">Professional Christmas Light Visualization by Your Company</p>
```

## Technical Requirements
- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- No server-side requirements (pure client-side application)

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Size
- Total size: ~45KB (HTML + embedded CSS/JS)
- No external dependencies except CDN resources (Tailwind CSS, Lucide icons)

## Support
The tool includes built-in instructions and intuitive controls. Key user interactions:
- **String Lights**: Click to start, click to continue, double-click to finish
- **Mini Lights**: Hold Shift + drag to trace areas
- **Undo**: Ctrl/Cmd + Z or use the undo button
- **Export**: Click the Export button to download the mockup

## SEO Benefits
- Engaging interactive tool increases time on site
- Unique value proposition for holiday lighting services
- Professional presentation builds trust and credibility
- Shareable results can drive social media engagement

## Implementation Steps
1. Upload `holiday-light-mockup-v2.html` to your web server
2. Add a button/link to your Holiday Light service page
3. Test the integration on different devices
4. Optional: Customize branding and colors
5. Monitor usage and customer feedback

This tool will help differentiate your holiday lighting services and provide customers with a professional, interactive experience that showcases your capabilities.