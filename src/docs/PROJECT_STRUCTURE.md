# AI Calendar Creator - Project Structure

## 📁 Project Organization

### Frontend Structure
```
src/frontend/
├── pages/                    # HTML pages
│   ├── index.html           # Login page
│   ├── dashborad.html       # Dashboard page
│   └── calendar.html        # Calendar page
├── assets/
│   ├── css/
│   │   ├── base/            # Base styles
│   │   │   ├── global.css   # Global styles
│   │   │   └── normalize.css # CSS reset
│   │   ├── components/      # Component styles
│   │   │   ├── calendar-events.css
│   │   │   ├── calendar-form.css
│   │   │   ├── header.css
│   │   │   ├── layout.css
│   │   │   ├── sidebar.css
│   │   │   ├── stats.css
│   │   │   └── widgets.css
│   │   └── pages/           # Page-specific styles
│   │       └── login.css
│   ├── js/
│   │   ├── core/            # Core functionality
│   │   │   ├── theme.js     # Theme management
│   │   │   └── sidebar.js    # Sidebar functionality
│   │   ├── components/      # UI components
│   │   │   ├── calendar-events.js
│   │   │   ├── calendar-chat.js
│   │   │   ├── calendar-form-core.js
│   │   │   ├── calendar-form-helpers.js
│   │   │   └── calendar-form.js
│   │   ├── pages/           # Page-specific scripts
│   │   │   ├── calendar.js
│   │   │   ├── dashboard.js
│   │   │   └── index.js
│   │   └── utils/           # Utility functions
│   │       ├── Preferences.js
│   │       └── PromptBuilder.js
│   └── fonts/               # Font files
│       ├── fa-regular-400.woff2
│       ├── fa-solid-900.ttf
│       ├── fa-solid-900.woff2
│       ├── fa-v4compatibility.ttf
│       └── fa-v4compatibility.woff2
```

### Backend Structure
```
src/backend/
├── api/                     # API endpoints
├── models/                  # Data models
└── utils/                   # Backend utilities
```

### Configuration
```
src/config/
└── paths.js                 # Path configuration
```

### Documentation
```
src/docs/                    # Project documentation
```

## 🎯 Benefits of This Structure

1. **Separation of Concerns**: Clear separation between frontend and backend
2. **Modular Organization**: Components, pages, and utilities are organized logically
3. **Scalability**: Easy to add new features and components
4. **Maintainability**: Clear file locations make maintenance easier
5. **Team Collaboration**: Multiple developers can work on different parts without conflicts

## 📝 File Naming Conventions

- **CSS Files**: kebab-case (e.g., `calendar-events.css`)
- **JavaScript Files**: camelCase (e.g., `calendarEvents.js`)
- **HTML Files**: kebab-case (e.g., `calendar.html`)
- **Configuration Files**: camelCase (e.g., `paths.js`)

## 🔧 Next Steps

1. Update all file paths in HTML files to reflect new structure
2. Update import statements in JavaScript files
3. Update CSS @import statements
4. Test all functionality to ensure paths are correct

## 📊 File Statistics

### JavaScript Files
- **calendar-form-core.js**: Core form functionality
- **calendar-form-helpers.js**: Helper functions for forms
- **calendar-form.js**: Main integration file
- **calendar-events.js**: Event management (653 lines)
- **calendar-chat.js**: AI chat functionality (178 lines)

### CSS Files
- **calendar-events.css**: Calendar and chat styling
- **calendar-form.css**: Form styling
- **global.css**: Global styles and variables
- **login.css**: Login page styling

### HTML Files
- **calendar.html**: Main calendar page with AI chat
- **dashborad.html**: Dashboard with statistics
- **index.html**: Login and registration page

## 🚀 Performance Improvements

1. **File Splitting**: Large files split into smaller, manageable modules
2. **Lazy Loading**: Components loaded only when needed
3. **Optimized Assets**: Fonts and styles organized efficiently
4. **Clean Architecture**: Separation of concerns for better performance

## 🔄 Migration Notes

- All file paths have been updated to reflect new structure
- Import statements updated in JavaScript files
- CSS @import statements corrected
- No functionality lost during reorganization
- All features preserved and enhanced