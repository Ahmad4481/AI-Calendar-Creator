# AI Calendar Creator 📅

Smart Calendar Builder - Advanced web application for event and schedule management with AI support

## 🚀 Features

- **Interactive Calendar** with ability to add and edit events
- **Artificial Intelligence** for user interaction
- **Responsive Design** that works on all devices
- **Arabic Interface** with easy-to-use design
- **Advanced Management** for events and schedules

## 📁 Organized Project Structure

```
AI-Calendar-Creator/
├── src/
│   ├── frontend/
│   │   ├── pages/                    # HTML pages
│   │   │   ├── index.html           # Login page
│   │   │   ├── dashborad.html       # Dashboard
│   │   │   └── calendar.html        # Calendar page
│   │   └── assets/
│   │       ├── css/
│   │       │   ├── base/            # Base styles
│   │       │   │   ├── global.css   # Global styles
│   │       │   │   └── normalize.css # CSS reset
│   │       │   ├── components/      # Component styles
│   │       │   │   ├── calendar-events.css
│   │       │   │   ├── calendar-form.css
│   │       │   │   ├── header.css
│   │       │   │   ├── layout.css
│   │       │   │   ├── sidebar.css
│   │       │   │   ├── stats.css
│   │       │   │   └── widgets.css
│   │       │   └── pages/           # Page-specific styles
│   │       │       └── login.css
│   │       ├── js/
│   │       │   ├── core/            # Core functionality
│   │       │   │   ├── sidebar.js  # Sidebar functionality
│   │       │   │   └── theme.js    # Theme management
│   │       │   ├── components/      # JavaScript components
│   │       │   │   ├── calendar-chat.js      # AI chat
│   │       │   │   ├── calendar-events.js   # Event management
│   │       │   │   ├── calendar-form-core.js # Calendar form core
│   │       │   │   ├── calendar-form-helpers.js # Form helper functions
│   │       │   │   └── calendar-form.js     # Main form file
│   │       │   ├── pages/           # Page-specific scripts
│   │       │   │   ├── calendar.js
│   │       │   │   ├── dashboard.js
│   │       │   │   └── index.js
│   │       │   └── utils/           # Utility functions
│   │       │       ├── Preferences.js
│   │       │       └── PromptBuilder.js
│   │       └── fonts/               # Font files
│   │           ├── fa-regular-400.woff2
│   │           ├── fa-solid-900.ttf
│   │           ├── fa-solid-900.woff2
│   │           ├── fa-v4compatibility.ttf
│   │           └── fa-v4compatibility.woff2
│   ├── backend/
│   │   ├── api/                     # API endpoints
│   │   ├── models/                  # Data models
│   │   └── utils/                   # Server utilities
│   ├── config/
│   │   └── paths.js                 # Path configuration
│   └── docs/
│       └── PROJECT_STRUCTURE.md     # Structure documentation
├── backend/                         # Server folder (empty for now)
└── README.md                        # This file
```

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Page structure
- **CSS3** - Design and styling
- **JavaScript ES6+** - Interactive functionality
- **FullCalendar** - Calendar library
- **Flatpickr** - Date and time picker
- **Choices.js** - Enhanced dropdown lists
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment (planned)
- **Express.js** - Framework (planned)

## 📋 Main Files

### Pages
- `src/frontend/pages/index.html` - Login page
- `src/frontend/pages/dashborad.html` - Main dashboard
- `src/frontend/pages/calendar.html` - Calendar and events page

### Styles
- `src/frontend/assets/css/base/global.css` - Global styles
- `src/frontend/assets/css/components/` - Component styles
- `src/frontend/assets/css/pages/login.css` - Login page styles

### Scripts
- `src/frontend/assets/js/core/theme.js` - Theme management
- `src/frontend/assets/js/core/sidebar.js` - Sidebar functionality
- `src/frontend/assets/js/components/calendar-events.js` - Event management
- `src/frontend/assets/js/components/calendar-chat.js` - AI chat
- `src/frontend/assets/js/components/calendar-form-core.js` - Calendar form core
- `src/frontend/assets/js/components/calendar-form-helpers.js` - Form helper functions

## 🎨 Design

- **Consistent Color System** with CSS variables
- **Responsive Design** for all screen sizes
- **Smooth Visual Effects** and attractive animations
- **Arabic Interface** with RTL support

## 🔧 Development

### System Requirements
- Modern browser with ES6+ support
- Web server (for current stage)

### Project Setup
1. Clone the repository
2. Open files in a web browser
3. Use a local server for development

## 📝 Recent Updates

### ✅ Path Updates Completed
- **HTML Files**: Updated all CSS and JS paths
- **JavaScript Files**: Updated imports and requires
- **CSS Files**: Updated @import statements

### ✅ Large Files Split
- **calendar-form.js**: Split into 3 files:
  - `calendar-form-core.js` - Core functionality
  - `calendar-form-helpers.js` - Helper functions
  - `calendar-form.js` - Main integration file

### ✅ Organized Structure
- Clear separation between components and pages
- Logical file organization
- Easy maintenance and development

## 🎯 New Features

1. **Logical Organization** - Clear separation between components and pages
2. **Scalability** - Easy to add new components
3. **Maintainability** - Clear file locations
4. **Team Collaboration** - Multiple developers can work without conflicts
5. **Industry Standards** - Structure follows best practices

## ⚠️ Important Notes

- **Paths**: All file paths updated to reflect new structure
- **Compatibility**: Project compatible with all modern browsers
- **Performance**: Optimized performance with efficient use of external libraries
- **Splitting**: Large files split to improve performance and maintenance

## 🤝 Contributing

Contributions are welcome! Please follow existing code standards and ensure compatibility with the organized structure.



**Project successfully organized and updated! 🎉**

**All paths updated and files organized! ✅**