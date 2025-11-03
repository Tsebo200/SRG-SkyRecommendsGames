# 🎨 Nature Palette Theme Documentation

## Overview
The Nature Palette is a custom color theme for the SRG (Sky Recommends Games) app, featuring a carefully curated palette of nature-inspired colors.

## Color Mapping

### Your Original Colors → Theme Usage

| Original Color | Hex Code | Theme Usage | Description |
|----------------|----------|-------------|-------------|
| `#2c7083` | Teal Blue | **Primary** | Main brand color, buttons, active states |
| `#87695f` | Warm Brown | **Text Secondary** | Secondary text, borders, inactive elements |
| `#f1d9bd` | Cream | **Background (Light)** | Main background in light mode |
| `#7bb4bd` | Light Blue | **Secondary** | Secondary actions, borders |
| `#dba879` | Golden Brown | **Accent** | Highlights, warnings, special elements |
| `#413d3e` | Dark Gray | **Text (Light)** | Primary text in light mode |
| `#01a161` | Green | **Success** | Success states, positive feedback |
| `#dfe8f1` | Light Blue-Gray | **Surface** | Cards, surfaces, tab bar |

### Light Mode Color Scheme
```
Background: #f1d9bd (Cream)
Surface: #dfe8f1 (Light Blue-Gray)
Primary: #2c7083 (Teal Blue)
Secondary: #7bb4bd (Light Blue)
Text: #413d3e (Dark Gray)
Text Secondary: #87695f (Warm Brown)
Accent: #dba879 (Golden Brown)
Success: #01a161 (Green)
```

### Dark Mode Color Scheme
```
Background: #413d3e (Dark Gray)
Surface: #87695f (Warm Brown)
Primary: #7bb4bd (Light Blue)
Secondary: #2c7083 (Teal Blue)
Text: #f1d9bd (Cream)
Text Secondary: #dfe8f1 (Light Blue-Gray)
Accent: #dba879 (Golden Brown)
Success: #01a161 (Green)
```

## Theme Features

### ✅ **Accessibility**
- WCAG AA contrast ratios maintained
- High contrast mode available
- Color blindness support (protanomaly, deuteranomaly, tritanomaly)

### ✅ **Responsive Design**
- Light and dark mode variants
- Automatic theme switching
- Consistent color usage across components

### ✅ **Nature-Inspired**
- Earth tones and natural colors
- Warm, inviting color palette
- Professional yet approachable design

## Usage

### Apply the Theme
```bash
npm run reset-theme
```

### View Color Palette
1. Open the app
2. Go to Profile tab
3. Tap "Colour Palette Preview"
4. See all colors in action

### Switch Between Light/Dark
1. Go to Profile tab
2. Tap "Colour Theme"
3. Select Light or Dark mode

## Technical Implementation

### Files Modified
- `lib/color-themes.ts` - Added Nature Palette theme
- `components/ColorPalettePreview.tsx` - Visual preview component
- `app/(tabs)/profile.tsx` - Added preview functionality
- `scripts/reset-to-nature-theme.js` - Theme reset script

### Theme Structure
```typescript
{
  id: 'custom-nature',
  name: 'Nature Palette',
  lightColors: { /* Light mode colors */ },
  darkColors: { /* Dark mode colors */ },
  accessibility: { /* Accessibility features */ }
}
```

## Color Psychology

### Why These Colors Work
- **Teal Blue (#2c7083)**: Trust, stability, professionalism
- **Warm Brown (#87695f)**: Earthiness, reliability, comfort
- **Cream (#f1d9bd)**: Warmth, cleanliness, approachability
- **Light Blue (#7bb4bd)**: Calm, clarity, secondary actions
- **Golden Brown (#dba879)**: Energy, warmth, highlights
- **Dark Gray (#413d3e)**: Sophistication, readability
- **Green (#01a161)**: Success, growth, positive feedback
- **Light Blue-Gray (#dfe8f1)**: Neutrality, subtlety, surfaces

## Benefits

### 🎯 **User Experience**
- Warm, inviting interface
- Easy on the eyes
- Professional appearance
- Consistent visual language

### 🎯 **Accessibility**
- High contrast ratios
- Color blindness support
- Clear visual hierarchy
- Readable text in all contexts

### 🎯 **Brand Identity**
- Unique, memorable color scheme
- Nature-inspired aesthetic
- Professional gaming app appearance
- Consistent with app's purpose

## Future Enhancements

### Potential Additions
- Seasonal color variations
- User-customizable accent colors
- Dynamic color themes based on time of day
- Additional accessibility options

---

**The Nature Palette theme transforms your app into a beautiful, nature-inspired gaming companion that's both professional and inviting! 🌿🎮**







