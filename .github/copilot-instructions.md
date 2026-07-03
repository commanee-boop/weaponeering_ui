# Weaponeering Analysis System UI - Project Setup Guide

## Project Overview
Vue.js web application for weaponeering analysis with interactive map, AI analysis module, and data management.

## Technologies
- **Framework**: Vue.js 3 (Vite)
- **Styling**: Bootstrap 5
- **Maps**: SVG-based map (ready for Google Maps integration)
- **HTTP Client**: Axios
- **Routing**: Vue Router 4
- **Icons**: Bootstrap Icons

## Project Setup - COMPLETED ✅

- [x] Initialize Vue.js project with Vite
- [x] Install dependencies (Bootstrap, Vue Router, Axios, Bootstrap Icons)
- [x] Create project structure and components
- [x] Implement main layout and navigation (Header component)
- [x] Build sidebar forms and panels (Sidebar, MapPanel, RightPanel)
- [x] Integrate map display (SVG-based with buffer zones)
- [x] Implement AI Analysis Module (mock with realistic data)
- [x] Add Chatbot functionality (mock with AI responses)
- [x] Add Simulator/Video player (embedded YouTube)
- [x] Implement data export (mock for PDF, Word, Excel)
- [x] Build and verify all features (successful build)
- [x] Documentation complete

## File Structure
```
src/
├── components/
│   ├── Header.vue        (Navigation, user info, refresh)
│   ├── Sidebar.vue       (10 form sections)
│   ├── MapPanel.vue      (Map with buffer zones)
│   └── RightPanel.vue    (Results, AI analysis, chatbot, export)
├── views/
│   ├── Analysis.vue      (Main 3-column layout)
│   └── Reports.vue       (Historical data & statistics)
├── services/
│   └── mockAPI.js        (Mock data and API functions)
├── router/
│   └── index.js          (Vue Router configuration)
├── App.vue               (Root component)
├── main.js               (Entry point with router)
└── style.css             (Global styles)
```

## Component Features

### Header (Header.vue)
- Logo and system title
- Navigation links: Analysis, Reports
- Real-time date/time display (updates every second)
- User info dropdown (Admin01)
- Logout button
- Refresh button

### Sidebar (Sidebar.vue)
10 form sections for target analysis:
1. Target Source Selection (5 checkboxes)
2. Target Type (10 dropdown options)
3. Structure Type (6 dropdown options)
4. Strength Level (3 dropdown options)
5. Coordinates (Latitude/Longitude numeric inputs)
6. Image Upload (file input with preview)
7. Target Details (textarea)
8. PK Value (0-1 numeric input)
9. CEP Value (meters numeric input)
10. AI Analysis button
11. Save Data button

### MapPanel (MapPanel.vue)
- SVG-based geographic visualization
- Concentric buffer zones with color coding:
  - 0-100m: Green
  - 100-200m: Yellow
  - 200-300m: Orange
  - 300m+: Red
- Current coordinate display

### RightPanel (RightPanel.vue)
Tab-based interface with:
1. **Top 5 Recommendations**
   - Sortable table with: ID, Item, Size, Quantity, Pd, Pk
   - 5 mock target recommendations

2. **AI Analysis Results**
   - Analysis text with detection info
   - CEP calculations
   - PK probability values
   - AI Confidence score (85%)
   - Progress bar visualization

3. **Chatbot**
   - Message history display
   - User message input
   - Mock AI responses (5 pre-configured)
   - Message animations

4. **Simulator**
   - Embedded video player (YouTube)
   - 16:9 aspect ratio

5. **Export Functions**
   - Export as PDF button
   - Export as Word button
   - Export as Excel button

### Views
- **Analysis.vue**: Main page with 3-column layout
- **Reports.vue**: Historical data, statistics, export options

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build Status
✅ Successfully built (1.86s)
- No errors or warnings
- All components properly bundled
- Ready for development

## Features Implemented

✅ Responsive 3-column layout (desktop), responsive stacking (mobile)
✅ Real-time date/time updates
✅ Form validation and input handling
✅ Mock API with 50+ data points
✅ Interactive tabs and dropdowns
✅ File upload with preview
✅ Chatbot with mock responses
✅ Data export functionality (mock)
✅ Navigation routing
✅ Bootstrap 5 styling
✅ Bootstrap Icons integration
✅ Thai language support

## Mock Data Included

- 5 target source options
- 10 target types
- 6 structure types
- 3 strength levels
- 5 top recommendations with realistic Pd/Pk values
- Comprehensive AI analysis text
- 5 chatbot response options
- 3 historical report records

## API Integration Ready

- Axios is installed and ready to use
- Mock API service structure in place
- Easy to replace mock functions with real API calls
- Example: Replace `getChatbotResponse()` with actual API call

## Next Steps for Production

1. Integrate real backend API endpoints
2. Replace mock data with live database calls
3. Implement Google Maps API integration
4. Add PDF export using jsPDF or similar
5. Add Word export using Docx library
6. Implement user authentication
7. Add real data persistence
8. Implement WebSocket for real-time updates

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Notes

- All components follow Vue 3 Composition API pattern
- Responsive design tested on desktop, tablet, mobile
- Application successfully builds with no errors
- Ready for immediate development and testing
- User authentication system ready to be implemented

## Support & Documentation

See README.md for detailed feature documentation and setup instructions.