# Holiday Light Mockup Tool - Implementation Instructions

## FOR WEB MANAGER - IMPLEMENTATION PACKAGE

### STEP 1: Create the Tool File
1. Create a new folder called `tools` in your website's root directory
2. Inside the `tools` folder, create a file called `holiday-light-mockup.html`
3. Copy and paste the complete HTML code provided below into this file

### STEP 2: Add the Button to Holiday Light Page
On your Holiday Light service page, add this button code:

```html
<a href="/tools/holiday-light-mockup.html" target="_blank" class="btn btn-primary">
    Customize Your Home
</a>
```

**Or if you prefer a button element:**
```html
<button onclick="window.open('/tools/holiday-light-mockup.html', '_blank')" class="btn btn-primary">
    Customize Your Home
</button>
```

### STEP 3: Test the Integration
1. Upload the file to your server
2. Visit your Holiday Light page
3. Click the "Customize Your Home" button
4. Verify the tool opens in a new tab
5. Test uploading a photo and drawing lights

### FINAL RESULT:
- Homepage stays exactly the same
- Tool accessible at: `yourdomain.com/tools/holiday-light-mockup.html`
- Button opens tool in new tab
- Professional branded experience

---

## COMPLETE HTML CODE FOR THE TOOL:
(Copy everything below into the holiday-light-mockup.html file)