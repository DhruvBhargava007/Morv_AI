# Predictive Insights UI Design Document
## Tank Maintenance Analytics Dashboard

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Design Philosophy](#design-philosophy)
3. [Page Architecture](#page-architecture)
4. [Visual Design System](#visual-design-system)
5. [Component Specifications](#component-specifications)
6. [User Interaction Flows](#user-interaction-flows)
7. [Responsive Design](#responsive-design)
8. [Implementation Guidelines](#implementation-guidelines)

---

## Executive Summary

This document outlines the complete UI/UX design for a predictive insights dashboard that enables maintenance personnel to analyze tank fleet data, predict failures, optimize maintenance schedules, and forecast parts requirements. The interface features a modern dark theme with minimalistic design principles, flexible weighting controls, and an AI-powered assistant for contextual help.

**Key Features:**
- Dual-view mode: Fleet Overview and Single Tank Analysis
- Three prediction types: Failure Predictions, Maintenance Scheduling, Parts Forecasting
- Hierarchical weight adjustment system for 10 major tank systems
- Context upload capability for enhanced predictions
- AI assistant bot for real-time help and insights

---

## Design Philosophy

### Core Principles

**1. Information Hierarchy**
- Critical information (failures, alerts) prominently displayed
- Secondary details accessible through progressive disclosure
- Clear visual differentiation between data types

**2. Minimalism with Purpose**
- Clean layouts with generous whitespace
- Information displayed only when needed
- Collapsible sections for detailed data

**3. Dark Mode Optimization**
- Reduced eye strain for long monitoring sessions
- High contrast for readability
- Strategic use of color for status indication

**4. Responsive Intelligence**
- Real-time updates as weights change
- Immediate visual feedback on user actions
- Smooth transitions between states

---

## Page Architecture

### Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                 │
│  [Logo] Predictive Insights          [Fleet ◐ Single] [Settings] [👤] │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  BREADCRUMB & QUICK STATS                                               │
│  Home > Predictive Insights > Fleet Overview                            │
│  [12 Tanks] [3 Critical] [8 Warnings] [Last Updated: 2m ago]           │
└─────────────────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────────────────┐
│          │  MAIN CONTENT AREA                                           │
│  WEIGHT  │                                                               │
│  PANEL   │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  (Coll-  │  │ FAILURE        │ │ MAINTENANCE    │ │ PARTS          │  │
│  apsible)│  │ PREDICTIONS    │ │ SCHEDULING     │ │ FORECASTING    │  │
│          │  │                │ │                │ │                │  │
│  [≡]     │  └────────────────┘ └────────────────┘ └────────────────┘  │
│  Systems │                                                               │
│  ├─▼ Pow-│  ┌──────────────────────────────────────────────────────┐  │
│  │  ertr-│  │ CONTEXT UPLOAD SECTION                               │  │
│  │  ain  │  │ [Drag & drop files or click to browse]              │  │
│  ├─▶ Sus-│  └──────────────────────────────────────────────────────┘  │
│  │  pens-│                                                               │
│  │  ion  │  ┌──────────────────────────────────────────────────────┐  │
│  ├─▶ Wea-│  │ FLEET OVERVIEW / SINGLE TANK VIEW                    │  │
│  ...     │  │ (Content changes based on toggle)                    │  │
│          │  └──────────────────────────────────────────────────────┘  │
│          │                                                               │
└──────────┴──────────────────────────────────────────────────────────────┘
                                                              ┌──────────┐
                                                              │   BOT    │
                                                              │  BUBBLE  │
                                                              │   💬     │
                                                              └──────────┘
```

### Layout Grid System

**Desktop (1920x1080 and above)**
- Container: 1600px max-width, centered
- Grid: 12 columns, 24px gutters
- Sidebar: 320px fixed width (collapsible)
- Main content: Remaining space (fluid)

**Spacing Scale (8px base)**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

---

## Visual Design System

### Color Palette

#### Primary Colors
```
Background Layers:
├─ Primary Background:   #0A0E1A (Deep Space Blue)
├─ Secondary Background: #151922 (Midnight Blue)
├─ Card Background:      #1E2433 (Charcoal Blue)
└─ Elevated Card:        #252B3D (Slate Blue)

Accent Colors:
├─ Primary Accent:       #00A3FF (Electric Blue)
├─ Primary Hover:        #0088D6 (Deep Electric)
└─ Primary Active:       #006DB3 (Ocean Blue)

Status Colors:
├─ Critical/Error:       #FF4444 (Bright Red)
├─ Warning:              #FFB627 (Amber)
├─ Success/Good:         #00D68F (Mint Green)
├─ Info:                 #4DA3FF (Sky Blue)
└─ Neutral:              #6B7280 (Gray)

Text Colors:
├─ Primary Text:         #FFFFFF (Pure White)
├─ Secondary Text:       #B8C4D4 (Soft Gray)
├─ Tertiary Text:        #6B7690 (Muted Gray)
└─ Disabled Text:        #4A5268 (Dark Gray)

Border Colors:
├─ Default:              #2D3548 (Subtle Border)
├─ Hover:                #3D4558 (Border Highlight)
└─ Focus:                #00A3FF (Accent Border)
```

#### Color Usage Guidelines

**Critical Alerts**: Use #FF4444 with subtle glow effect
**Warnings**: Use #FFB627 with pulsing animation for unread
**Success States**: Use #00D68F for confirmations
**Interactive Elements**: Use #00A3FF for buttons, links, active states
**Data Visualization**: Create gradients between status colors

### Typography System

#### Font Families
```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace
```

#### Type Scale
```
Hero:        48px / 56px line-height / 700 weight
H1:          32px / 40px / 600 weight
H2:          24px / 32px / 600 weight
H3:          20px / 28px / 600 weight
H4:          18px / 24px / 600 weight
Body Large:  16px / 24px / 400 weight
Body:        14px / 20px / 400 weight
Body Small:  12px / 16px / 400 weight
Caption:     11px / 14px / 400 weight
```

#### Typography Usage
- **Headings**: Inter, medium-semibold weight
- **Body Text**: Inter, regular weight
- **Data Values**: JetBrains Mono for numbers, IDs, timestamps
- **Labels**: Inter, 12px, uppercase, letter-spacing 0.5px

### Component Styling

#### Card Styles
```css
Standard Card:
├─ Background: #1E2433
├─ Border: 1px solid #2D3548
├─ Border Radius: 12px
├─ Padding: 24px
├─ Shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
└─ Hover: Border color #3D4558, subtle lift

Elevated Card (Active/Selected):
├─ Background: #252B3D
├─ Border: 1px solid #00A3FF
├─ Shadow: 0 8px 24px rgba(0, 163, 255, 0.1)
└─ Transform: translateY(-2px)

Alert Card:
├─ Background: #1E2433
├─ Border-left: 4px solid [status color]
└─ Icon in matching status color
```

#### Button Styles
```css
Primary Button:
├─ Background: #00A3FF
├─ Text: #FFFFFF
├─ Border Radius: 8px
├─ Padding: 12px 24px
├─ Hover: Background #0088D6
├─ Active: Background #006DB3
└─ Transition: 200ms ease

Secondary Button:
├─ Background: transparent
├─ Border: 1px solid #2D3548
├─ Text: #B8C4D4
├─ Hover: Border #00A3FF, Text #FFFFFF
└─ Active: Background rgba(0, 163, 255, 0.1)

Icon Button:
├─ Size: 40x40px
├─ Background: transparent
├─ Hover: Background rgba(255, 255, 255, 0.05)
└─ Icon color: #B8C4D4, Hover: #FFFFFF
```

#### Form Elements
```css
Input Fields:
├─ Background: #151922
├─ Border: 1px solid #2D3548
├─ Border Radius: 8px
├─ Padding: 12px 16px
├─ Text: #FFFFFF
├─ Placeholder: #6B7690
├─ Focus: Border #00A3FF, Shadow 0 0 0 3px rgba(0, 163, 255, 0.1)

Sliders:
├─ Track: Background #2D3548, Height 4px
├─ Fill: Background #00A3FF
├─ Thumb: 16x16px circle, Background #FFFFFF, Shadow 0 2px 4px rgba(0,0,0,0.3)
├─ Hover: Thumb scale 1.2
└─ Active: Fill gradient from #00A3FF to #00D68F
```

### Icons & Illustrations

**Icon Set**: Lucide Icons or Heroicons (outlined style)
**Icon Sizes**: 16px, 20px, 24px, 32px
**Icon Color**: Inherit from parent text color
**Status Icons**: Filled style with status colors

### Animation & Transitions

```css
Standard Transitions:
├─ Hover effects: 200ms ease
├─ Color changes: 150ms ease
├─ Layout shifts: 300ms cubic-bezier(0.4, 0, 0.2, 1)
├─ Modal/drawer: 250ms ease-in-out
└─ Micro-interactions: 100ms ease

Loading States:
├─ Spinner: Rotating #00A3FF circle
├─ Skeleton: Shimmer effect across #2D3548 background
└─ Progress bar: Animated gradient

Special Effects:
├─ Critical alerts: Gentle pulse (2s infinite)
├─ New data: Fade-in with slide up (300ms)
├─ Success: Checkmark with scale animation
└─ Error: Shake animation (400ms)
```

---

## Component Specifications

### 1. Header Component

```
┌─────────────────────────────────────────────────────────────────┐
│ [🛡️ Logo] Predictive Insights    [Fleet ◐ Single] [⚙️] [👤]  │
└─────────────────────────────────────────────────────────────────┘
```

**Structure:**
- Height: 72px
- Background: #151922
- Border-bottom: 1px solid #2D3548
- Sticky positioning

**Elements:**
1. **Logo & Title**
   - Logo: 32x32px icon
   - Title: "Predictive Insights" - H3 style
   - Gap: 12px

2. **View Toggle** (Center-aligned)
   - Segmented control
   - Options: "Fleet" | "Single"
   - Active state: Primary accent background
   - Width: 200px
   - Height: 40px

3. **Right Actions**
   - Settings icon button (40x40px)
   - User profile avatar (40x40px)
   - Gap: 8px

---

### 2. Stats Bar Component

```
┌─────────────────────────────────────────────────────────────────┐
│ Home > Predictive Insights > Fleet Overview                    │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────┐              │
│ │  12  │ │  3   │ │  8   │ │ Last Updated:    │              │
│ │Tanks │ │Crit. │ │Warn. │ │ 2 minutes ago    │              │
│ └──────┘ └──────┘ └──────┘ └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

**Structure:**
- Background: #0A0E1A
- Padding: 16px 24px
- Border-bottom: 1px solid #2D3548

**Breadcrumb:**
- Font: 12px
- Color: #B8C4D4
- Separator: ">" with 8px margin

**Stat Cards:**
- Display: inline-flex
- Gap: 16px
- Each card:
  - Size: 100px x 80px (auto-width for last updated)
  - Background: #1E2433
  - Border-radius: 8px
  - Padding: 12px
  - Number: 24px bold, color based on status
  - Label: 12px, #B8C4D4

---

### 3. Weight Adjustment Panel

```
┌──────────────────┐
│ WEIGHT SETTINGS  │ [Minimize ⇔]
├──────────────────┤
│ Presets:         │
│ [Balanced] [Def.] [Off.] [Custom]
├──────────────────┤
│ ▼ POWERTRAIN     │ 15% ━━━━━━━━○─
│   ├─ Engine      │ 40% ━━━━━○────
│   ├─ Trans.      │ 35% ━━━○──────
│   └─ Cooling     │ 25% ━━○───────
│                  │
│ ▶ SUSPENSION     │ 12% ━━━━━━━○──
│                  │
│ ▶ WEAPONS        │ 18% ━━━━━━━━━○
│                  │
│ ▶ ARMOR          │ 10% ━━━━━○────
│                  │
│ ▶ ELECTRICAL     │ 13% ━━━━━━○───
│                  │
│ ▶ FIRE CONTROL   │ 11% ━━━━━○────
│                  │
│ ▶ COMMUNICATION  │  8% ━━━○──────
│                  │
│ ▶ HYDRAULICS     │  7% ━━○───────
│                  │
│ ▶ CREW SYSTEMS   │  4% ━○────────
│                  │
│ ▶ AMMUNITION     │  2% ○─────────
├──────────────────┤
│ Total: 100%  ✓   │
│ [Reset] [Apply]  │
└──────────────────┤
│ IMPACT PREVIEW   │
│ ┌──────────────┐ │
│ │ Failure risk │ │
│ │ +12% in Susp.│ │
│ │ -5% in Crew  │ │
│ └──────────────┘ │
└──────────────────┘
```

**Structure:**
- Width: 320px (expanded), 48px (collapsed)
- Background: #1E2433
- Border-right: 1px solid #2D3548
- Position: Fixed to viewport height
- Overflow-y: auto with custom scrollbar

**Preset Buttons:**
- Display: flex, gap 8px
- Each: 60px wide, 32px height
- Active: Primary accent background

**System Categories:**
- Expandable accordion items
- Click to expand/collapse
- Arrow icon rotates 90° on expand
- Transition: 200ms ease

**Slider Controls:**
- Label: System/component name (left)
- Percentage: Current value (right)
- Slider: Full width, custom styled
- Real-time value update on drag

**Sub-components:**
- Indented 16px from parent
- Slightly smaller font (12px)
- Dimmed color (#B8C4D4)

**Impact Preview:**
- Fixed at bottom of panel
- Background: rgba(0, 163, 255, 0.05)
- Border-top: 1px solid #00A3FF
- Shows delta changes in predictions

**Collapsed State:**
- Shows only icons vertically
- Expand button at top
- Hovering shows tooltip with category name

---

### 4. Prediction Dashboard Cards

#### A. Failure Predictions Card

```
┌────────────────────────────────────────────────┐
│ ⚠️  FAILURE PREDICTIONS            [Expand ↗] │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │      RISK SCORE                          │ │
│  │        ┌──────┐                          │ │
│  │        │  67  │  High Risk               │ │
│  │        └──────┘                          │ │
│  │    ◷━━━━━●━━━━◷  (Range: 0-100)          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Critical Concerns (Next 30 Days):             │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 🔴 SUSPENSION - Road Wheels           │  │
│  │    Est. Failure: 12-18 days            │  │
│  │    Confidence: 87%                     │  │
│  │    [View Details →]                    │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 🟡 POWERTRAIN - Transmission          │  │
│  │    Est. Failure: 22-28 days            │  │
│  │    Confidence: 72%                     │  │
│  │    [View Details →]                    │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [View All Predictions →]                      │
└────────────────────────────────────────────────┘
```

**Specifications:**
- Card size: 100% width, min-height 400px
- Padding: 24px
- Grid layout: 3 columns on desktop

**Risk Score Gauge:**
- Circular progress indicator
- Color gradient: Green (0-30), Yellow (31-60), Red (61-100)
- Center displays numeric value (48px bold)
- Label underneath: Risk level (High/Medium/Low)

**Concern Items:**
- Stack vertically with 16px gap
- Each item:
  - Background: #151922
  - Border-left: 4px solid [status color]
  - Padding: 16px
  - Border-radius: 8px
  - Status icon (24px) in header
  - System name (H4 style)
  - Timeframe (Body text, #B8C4D4)
  - Confidence percentage with small progress bar
  - Details button on hover

**Expanded View:**
- Opens as modal overlay
- Shows timeline chart of all predictions
- Detailed breakdown of affected components
- Historical pattern analysis
- Mitigation recommendations

---

#### B. Maintenance Scheduling Card

```
┌────────────────────────────────────────────────┐
│ 🔧 MAINTENANCE SCHEDULING          [Expand ↗] │
├────────────────────────────────────────────────┤
│                                                │
│  Optimal Schedule (Next 90 Days):              │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  PRIORITY MATRIX                         │ │
│  │                                          │ │
│  │  High │ [2]  [1]   │  Urgent: 1         │ │
│  │  Impt.│      [3]   │  Soon: 2           │ │
│  │  ─────┼────────────│  Routine: 5        │ │
│  │  Low  │ [5]  [2]   │                    │ │
│  │  Impt.│            │                    │ │
│  │       └────────────│                    │ │
│  │       Low → High   │                    │ │
│  │       Urgency      │                    │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Upcoming Tasks:                               │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 📅 In 3 Days - Suspension Inspection   │  │
│  │    Duration: 4 hours                    │  │
│  │    Parts ready: ✓                      │  │
│  │    [Schedule] [Postpone]               │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 📅 In 7 Days - Oil Change (Engine)     │  │
│  │    Duration: 2 hours                    │  │
│  │    Parts ready: ✓                      │  │
│  │    [Schedule] [Postpone]               │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [View Full Calendar →]                        │
└────────────────────────────────────────────────┘
```

**Specifications:**
- Card size: 100% width, min-height 400px
- Grid layout matches other cards

**Priority Matrix:**
- 2x2 grid visualization
- X-axis: Urgency (Low to High)
- Y-axis: Importance (Low to High)
- Clickable numbers show tasks in each quadrant
- Color coding: Urgent+Important (red), etc.

**Task Items:**
- Calendar icon with status color
- Task name and system (H4)
- Metadata: Duration, parts status
- Action buttons (Schedule/Postpone)
- Hover shows more details

**Expanded View:**
- Full calendar interface (month/week view)
- Drag-and-drop scheduling
- Conflict detection
- Resource allocation view
- Maintenance history

---

#### C. Parts Forecasting Card

```
┌────────────────────────────────────────────────┐
│ 📦 PARTS FORECASTING               [Expand ↗] │
├────────────────────────────────────────────────┤
│                                                │
│  Required Parts (Next 60 Days):                │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  INVENTORY STATUS                        │ │
│  │  ━━━━━●━━━━━━━━━━━━                     │ │
│  │  72% Parts Available                     │ │
│  │                                          │ │
│  │  ✓ In Stock: 18 items                   │ │
│  │  ⧗ On Order: 4 items (ETA: 5-12 days)   │ │
│  │  ⚠ Need to Order: 3 items               │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Critical Parts Needed:                        │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ⚠️  Road Wheel Assembly (x6)           │  │
│  │     Qty Needed: 6  |  In Stock: 2      │  │
│  │     Need by: 10 days                    │  │
│  │     Lead time: 14 days ⚠️               │  │
│  │     [Order Now] [Find Alt.]             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 🟡 Transmission Fluid (20L)            │  │
│  │     Qty Needed: 20L  |  In Stock: 15L  │  │
│  │     Need by: 20 days                    │  │
│  │     Lead time: 3 days ✓                │  │
│  │     [Add to Cart] [Details]             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [View Complete List →] [Export to PDF]        │
└────────────────────────────────────────────────┘
```

**Specifications:**
- Card size: 100% width, min-height 400px
- Matches styling of other cards

**Inventory Status:**
- Progress bar showing overall readiness
- Breakdown of stock levels
- Color-coded status indicators

**Parts Items:**
- Status icon (Warning/Info/Success)
- Part name and quantity (H4)
- Comparison: Needed vs. In Stock
- Timeline: Need by date
- Lead time with warning if insufficient
- Action buttons (context-specific)
- Hover shows supplier info, price, alternatives

**Expanded View:**
- Full parts list with filters
- Sort by: Urgency, Cost, Availability
- Bulk ordering interface
- Supplier comparison
- Price trends chart
- Historical usage data

---

### 5. Context Upload Section

```
┌────────────────────────────────────────────────────────────────┐
│ 📄 UPLOAD ADDITIONAL CONTEXT                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌────────────────────────────────────────────────────────┐  │
│   │                                                        │  │
│   │              📁                                        │  │
│   │     Drag & drop files here                            │  │
│   │         or click to browse                            │  │
│   │                                                        │  │
│   │  Supported: .pdf, .csv, .xlsx, .json, .txt           │  │
│   │  Max size: 50MB per file                             │  │
│   │                                                        │  │
│   └────────────────────────────────────────────────────────┘  │
│                                                                │
│   Recently Uploaded:                                           │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ 📊 maintenance_log_oct2025.csv     [Processing...] ● │   │
│   │ 2.3 MB • Uploaded 1 min ago         [✕]             │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ 📄 sensor_data_tank_A7.json        [Processed] ✓    │   │
│   │ 1.1 MB • Uploaded 15 mins ago       [↻] [✕]        │   │
│   │ → Added 342 new data points                          │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ 📝 incident_report_052025.pdf      [Processed] ✓    │   │
│   │ 4.7 MB • Uploaded 2 hours ago       [↻] [✕]        │   │
│   │ → Identified 3 critical maintenance events            │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│   [View All Uploads (12)] [Clear History]                     │
└────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Full width card
- Margin-top: 32px from prediction cards
- Background: #1E2433

**Drop Zone:**
- Height: 200px
- Dashed border: 2px dashed #2D3548
- Border-radius: 12px
- Background on drag-over: rgba(0, 163, 255, 0.05)
- Border-color on drag-over: #00A3FF
- Center-aligned content
- Icon: 48px, #6B7690
- Text: #B8C4D4

**Upload Items:**
- Stack vertically, 12px gap
- Each item:
  - Background: #151922
  - Border-radius: 8px
  - Padding: 16px
  - Display: flex, justify-between
  - File icon (24px) based on type
  - File name (14px, #FFFFFF)
  - Status badge (Processing/Processed/Error)
  - File size and timestamp (#B8C4D4, 12px)
  - Action buttons (Reprocess, Delete)
  - Insights row showing what was extracted

**Status Indicators:**
- Processing: Animated spinner, blue
- Processed: Checkmark, green
- Error: X mark, red

**File Type Icons:**
- PDF: Red icon
- CSV/XLSX: Green icon
- JSON: Orange icon
- TXT: Gray icon

---

### 6. Fleet Overview Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [Grid View ⊞] [List View ≡]    [Filter ▼] [Sort: Risk Score ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ TANK A-001  │ │ TANK A-002  │ │ TANK A-003  │ │ TANK A-004│ │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌───────┐ │ │
│  │ │   92    │ │ │ │   67    │ │ │ │   45    │ │ │ │  28   │ │ │
│  │ │ Health  │ │ │ │ Health  │ │ │ │ Health  │ │ │ │Health │ │ │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └───────┘ │ │
│  │             │ │             │ │             │ │           │ │
│  │ Status: ✓   │ │ Status: ⚠️  │ │ Status: 🔴  │ │Status: ✓  │ │
│  │ Alerts: 0   │ │ Alerts: 3   │ │ Alerts: 7   │ │Alerts: 1  │ │
│  │ Updated: 1m │ │ Updated: 2m │ │ Updated: 5m │ │Updated:3m │ │
│  │             │ │             │ │             │ │           │ │
│  │ [Details →] │ │ [Details →] │ │ [Details →] │ │[Details→] │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ TANK A-005  │ │ TANK A-006  │ │ TANK A-007  │ │ TANK A-008│ │
│  │    ...      │ │    ...      │ │    ...      │ │   ...     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                  │
│  [Load More] or [Showing 12 of 47 tanks]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Displayed when "Fleet" toggle is active
- Replaces main content area below prediction cards

**Toolbar:**
- Height: 56px
- Display: flex, justify-between
- View toggle (left)
- Filters and sort (right)

**Grid View:**
- Responsive grid: 4 columns (desktop), 2 (tablet), 1 (mobile)
- Gap: 24px
- Equal height cards

**Tank Cards:**
- Size: Auto width, 300px height
- Background: #1E2433
- Border: 1px solid #2D3548
- Border-radius: 12px
- Padding: 20px
- Hover: Border #00A3FF, lift 4px

**Health Score:**
- Circular gauge (120px diameter)
- Color based on score: >70 green, 40-70 yellow, <40 red
- Center displays score (32px bold)
- Label underneath (12px)

**Status Row:**
- Icon + text for status
- Alert count with badge
- Last updated timestamp

**Details Button:**
- Full width
- Secondary button style
- Navigates to Single Tank View

**List View Alternative:**
- Table layout
- Columns: Tank ID, Health, Status, Alerts, Systems at Risk, Last Updated, Actions
- Sortable columns
- Row click to view details

**Filters:**
- Dropdown menu
- Options: All, Critical, Warning, Good, Offline
- Multi-select with checkboxes
- Apply/Clear buttons

---

### 7. Single Tank View Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Back to Fleet]                                               │
├──────────────────────────────────────────────────────────────────┤
│  TANK A-003 - M1A2 Abrams                [Edit] [Export Report] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Status: 🔴 Critical  |  Operating Hours: 3,245 | Location: B-7  │
│  Last Service: 12 days ago  |  Next Service: Overdue by 3 days   │
└──────────────────────────────────────────────────────────────────┘
│                                                                  │
│  ┌────────────────────┐ ┌──────────────────────────────────────┐│
│  │  SYSTEM HEALTH     │ │  CRITICAL ALERTS                     ││
│  │                    │ │                                      ││
│  │        ___         │ │  🔴 Suspension - Road Wheels         ││
│  │       /   \        │ │     Failure predicted in 12-18 days  ││
│  │      | 45  |       │ │     [View] [Acknowledge]             ││
│  │       \___/        │ │                                      ││
│  │                    │ │  🔴 Electrical - Battery Voltage     ││
│  │   [Radar Chart]   │ │     Below threshold (22.1V)          ││
│  │   showing all     │ │     [View] [Acknowledge]             ││
│  │   10 systems      │ │                                      ││
│  │                    │ │  🟡 Powertrain - Oil Pressure        ││
│  │                    │ │     Trending downward                ││
│  └────────────────────┘ │     [View] [Acknowledge]             ││
│                         │                                      ││
│                         │  [View All Alerts (7)]               ││
│                         └──────────────────────────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FAILURE TIMELINE (Next 90 Days)                           │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                            │ │
│  │  Today          30 Days          60 Days        90 Days   │ │
│  │    |               |                |               |     │ │
│  │    ▼               ▼                ▼               ▼     │ │
│  │    🔴              🟡              🟡              🟢     │ │
│  │   Susp.           Trans.          Cooling       (None)    │ │
│  │   (12-18d)        (22-28d)        (55-60d)               │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐  │
│  │ MAINTENANCE     │ │ PARTS STATUS    │ │ PERFORMANCE      │  │
│  │ HISTORY         │ │                 │ │ METRICS          │  │
│  │                 │ │ In Stock: 85%   │ │                  │  │
│  │ [Chart showing  │ │ On Order: 10%   │ │ [Line charts]    │  │
│  │  frequency of   │ │ Need Order: 5%  │ │ - Fuel eff.      │  │
│  │  services over  │ │                 │ │ - Reliability    │  │
│  │  past 12 months]│ │ Critical: 2     │ │ - Availability   │  │
│  │                 │ │ items needed    │ │                  │  │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  DETAILED SYSTEM BREAKDOWN                                 │ │
│  │  [Accordion showing all 10 systems with drill-down]        │ │
│  │                                                            │ │
│  │  ▼ SUSPENSION SYSTEM                          Status: 🔴  │ │
│  │    Overall Health: 23%                                     │ │
│  │    ├─ Road Wheels: 15% (Critical - Replace needed)        │ │
│  │    ├─ Tracks: 45% (Fair - Monitor closely)                │ │
│  │    ├─ Idler Wheels: 67% (Good)                            │ │
│  │    └─ Torsion Bars: 89% (Excellent)                       │ │
│  │                                                            │ │
│  │  ▶ POWERTRAIN SYSTEM                          Status: 🟡  │ │
│  │    Overall Health: 58%                                     │ │
│  │                                                            │ │
│  │  ▶ WEAPONS SYSTEMS                            Status: ✓   │ │
│  │    Overall Health: 94%                                     │ │
│  │  ...                                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Displayed when "Single" toggle is active
- Full-width scrollable layout

**Tank Header:**
- Background: #151922
- Padding: 24px
- Border-bottom: 1px solid #2D3548
- Tank ID + Model (H2)
- Action buttons (right-aligned)
- Metadata row with key stats

**System Health Visualization:**
- Radar/spider chart showing all 10 systems
- Each axis represents a system
- Color: Green outer, red center
- Current health plotted with filled area
- Interactive: Hover shows exact percentages
- Size: 400x400px

**Critical Alerts Panel:**
- Height matches health chart
- Scrollable if many alerts
- Each alert:
  - Status color bar
  - System name
  - Issue description
  - Action buttons
  - Expandable for more details

**Failure Timeline:**
- Horizontal timeline chart
- Today marked clearly
- Predicted failures plotted
- Color-coded by severity
- Clickable points for details
- Confidence bands (transparent overlay)

**Secondary Panels (3-column grid):**
- Equal width
- Height: 300px
- Charts appropriate to content
- Hover for detailed tooltips

**Detailed System Breakdown:**
- Accordion component
- Full width
- Each section:
  - System name and status
  - Overall health percentage
  - Sub-components in tree structure
  - Progress bars for health
  - Icons for status
  - Click to expand/collapse
  - Smooth animation

---

### 8. AI Assistant Bot Component

```
MINIMIZED STATE:
                  ┌─────┐
                  │ 💬  │ ← Floating bubble
                  │  ●  │ ← Pulse indicator (if active)
                  └─────┘

EXPANDED STATE:
                  ┌─────────────────────────┐
                  │ AI Assistant      [─][✕]│
                  ├─────────────────────────┤
                  │ 🤖 How can I help you   │
                  │    with predictive      │
                  │    insights?            │
                  ├─────────────────────────┤
                  │                         │
                  │ 👤 What does the risk   │
                  │    score mean?          │
                  │                         │
                  │ 🤖 The risk score is a  │
                  │    composite metric...  │
                  │    [Show in UI ↗]       │
                  │                         │
                  ├─────────────────────────┤
                  │ Quick Actions:          │
                  │ [Explain Weights]       │
                  │ [Upload Help]           │
                  │ [Export Guide]          │
                  ├─────────────────────────┤
                  │ [Type your question...] │
                  └─────────────────────────┘
```

**Specifications:**

**Minimized Bubble:**
- Position: Fixed, bottom-right
- Offset: 24px from bottom, 24px from right
- Size: 64x64px
- Background: #00A3FF
- Border-radius: 50%
- Box-shadow: 0 4px 16px rgba(0, 163, 255, 0.4)
- Icon: 32px white chat/message icon
- Pulse animation when new message available
- Z-index: 1000
- Hover: Scale 1.1

**Expanded Panel:**
- Position: Fixed, bottom-right
- Offset: 24px from bottom, 24px from right
- Size: 380px wide, 600px height
- Background: #1E2433
- Border: 1px solid #2D3548
- Border-radius: 16px
- Box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5)
- Z-index: 1000

**Header:**
- Height: 56px
- Background: #252B3D
- Border-radius: 16px 16px 0 0
- Padding: 16px
- Title: "AI Assistant" (H4)
- Minimize/Close buttons (right)

**Chat Area:**
- Height: 440px
- Padding: 16px
- Overflow-y: auto
- Custom scrollbar (thin, #2D3548)

**Messages:**
- User messages (right-aligned):
  - Background: #00A3FF
  - Color: #FFFFFF
  - Border-radius: 16px 16px 4px 16px
  - Padding: 12px 16px
  - Max-width: 80%
  
- Bot messages (left-aligned):
  - Background: #252B3D
  - Color: #FFFFFF
  - Border-radius: 16px 16px 16px 4px
  - Padding: 12px 16px
  - Max-width: 80%
  - Icon: 24px bot avatar

**Quick Actions:**
- Buttons in 2-column grid
- Background: transparent
- Border: 1px solid #2D3548
- Padding: 8px 12px
- Border-radius: 8px
- Hover: Border #00A3FF

**Input Field:**
- Height: 80px
- Background: #151922
- Border-top: 1px solid #2D3548
- Padding: 16px
- Input: Full width, transparent background
- Placeholder: #6B7690
- Send button: #00A3FF, circle, 40px

**Special Features:**
- "Show in UI" links highlight relevant components
- Code snippets rendered with syntax highlighting
- Typing indicator when bot is responding
- Message timestamps on hover
- Copy button for bot messages
- Context awareness (knows current page section)

---

## User Interaction Flows

### Flow 1: Initial Page Load

```
User arrives → Default Fleet View loads
              ↓
         Show summary stats
              ↓
         Load prediction cards with default weights
              ↓
         Highlight critical alerts
              ↓
         Bot shows welcome bubble
              ↓
         Ready for interaction
```

**Loading States:**
- Skeleton screens for cards (shimmer effect)
- Stats load first (fastest)
- Charts load progressively
- Smooth fade-in transitions

---

### Flow 2: Adjusting Prediction Weights

```
User clicks Weight Panel icon
              ↓
         Panel slides open from left (300ms)
              ↓
         Shows current weights (default: Balanced)
              ↓
User clicks preset OR adjusts sliders
              ↓
         Real-time update:
         - Impact Preview updates
         - Predictions recalculate (debounced 500ms)
         - Visual indicators show changes
              ↓
User clicks "Apply"
              ↓
         Loading spinner on prediction cards
              ↓
         Cards update with new predictions
         - Highlight changed values (brief yellow flash)
         - Update charts/gauges
              ↓
         Success notification
         Bot: "Predictions updated with new weights"
              ↓
         Auto-save to user preferences
```

**Interactions:**
- Slider drag: Smooth, real-time value update
- System expand: 200ms accordion animation
- Hover on impact preview: Tooltip with explanation
- Reset button: Confirmation modal if changes made
- Panel collapse: Minimizes to side icon bar

---

### Flow 3: Uploading Context Files

```
User drags file to upload zone
              ↓
         Zone highlights (border + background change)
              ↓
User drops file
              ↓
         Validation:
         - Check file type ✓
         - Check file size ✓
         - Virus scan (if applicable)
              ↓
         File appears in "Recently Uploaded"
         Status: [Processing...]
         Progress bar: 0% → 100%
              ↓
         Backend processing:
         - Parse file contents
         - Extract relevant data
         - Integrate with existing predictions
              ↓
         Status changes: [Processed] ✓
         Shows insight: "Added 342 new data points"
              ↓
         Prediction cards refresh automatically
         - Flash animation on updated sections
         - New data reflected in charts
              ↓
         Bot message: "I've processed your file. Found 3 new critical maintenance events."
              ↓
         User can click insights to see details
```

**Error Handling:**
- Invalid file type: Red border, error message
- File too large: Modal with size limit
- Processing error: Retry button, error details
- Timeout: Status shows "Processing delayed"

---

### Flow 4: Using AI Assistant

```
User clicks bot bubble
              ↓
         Panel expands (250ms slide-up)
         Welcome message appears
         Quick action buttons shown
              ↓
User clicks quick action OR types question
              ↓
         User message appears (right-aligned)
         Typing indicator shows
              ↓
         Bot response appears (animated, word-by-word)
         May include:
         - Text explanation
         - [Show in UI] links
         - Charts/diagrams
         - Action buttons
              ↓
User clicks [Show in UI] link
              ↓
         Panel minimizes
         Target component highlights (pulsing border)
         Tooltip appears with info
         After 5s, highlight fades
              ↓
User can click bot bubble again to continue conversation
```

**Bot Capabilities:**
- Explain prediction methodology
- Define terms and metrics
- Guide through weight adjustment
- Troubleshoot issues
- Export instructions
- Historical data queries

---

### Flow 5: Fleet to Single Tank Transition

```
User is in Fleet View
              ↓
         Sees tank cards grid
              ↓
User clicks [Details] on TANK A-003
              ↓
         Transition animation:
         - Card zooms forward
         - Other cards fade out
         - Background cross-fades
         - Duration: 400ms
              ↓
         View toggle switches to "Single"
         Header updates with tank info
              ↓
         Single Tank View loads:
         - Health chart animates in
         - Alerts appear
         - Timeline draws left-to-right
         - System breakdown accordion ready
              ↓
         Breadcrumb shows: Fleet > TANK A-003
              ↓
User clicks [← Back to Fleet]
              ↓
         Reverse transition
         Fleet View restores previous state:
         - Scroll position
         - Filters
         - Sort order
```

---

### Flow 6: Expanding Prediction Cards

```
User hovers over Failure Predictions card
              ↓
         [Expand] button becomes more prominent
              ↓
User clicks [Expand ↗]
              ↓
         Modal overlay fades in (200ms)
         Card expands to near-fullscreen
         Transition: Scale from card position
              ↓
         Expanded view shows:
         - Full timeline chart
         - Detailed predictions list
         - Filters and sorting options
         - Historical pattern analysis
         - Export buttons
              ↓
User interacts with expanded view:
         - Scroll through predictions
         - Filter by system
         - Adjust time range
         - View recommendations
              ↓
User clicks [✕] or clicks outside
              ↓
         Modal scales back to card position
         Overlay fades out
         Returns to main view
              ↓
         Card reflects any changes made
```

---

## Responsive Design

### Desktop (≥1920px)
- Full 12-column grid
- Weight panel: 320px sidebar
- Prediction cards: 3 columns
- Fleet cards: 4 columns
- All features visible

### Laptop (1366px - 1919px)
- 12-column grid with reduced margins
- Weight panel: 280px
- Prediction cards: 3 columns
- Fleet cards: 3 columns
- Font sizes slightly reduced

### Tablet (768px - 1365px)
- Weight panel: Modal overlay instead of sidebar
- Prediction cards: 2 columns or stacked
- Fleet cards: 2 columns
- Header condensed (hamburger menu)
- Bot panel: 320px wide

### Mobile (< 768px)
- Single column layout
- Weight panel: Full-screen modal
- Prediction cards: Stacked vertically
- Fleet view: List instead of grid
- Simplified charts (horizontal scrollable)
- Bot: Full-screen when expanded
- Bottom navigation bar
- Sticky header with essential controls

### Breakpoints
```css
$mobile: 320px;
$tablet: 768px;
$laptop: 1366px;
$desktop: 1920px;
$large: 2560px;
```

---

## Implementation Guidelines

### Technology Stack Recommendations

**Frontend Framework:**
- React 18+ with TypeScript
- Next.js for SSR/SSG if needed

**Styling:**
```
Option 1: TailwindCSS
- Utility-first approach
- Custom theme configuration
- JIT compilation

Option 2: Styled-Components
- CSS-in-JS
- Dynamic theming
- Component-scoped styles
```

**State Management:**
```
- Zustand (lightweight, recommended)
- Redux Toolkit (for complex state)
- Context API (for theme, auth)
```

**Charts & Visualizations:**
```
- Recharts (simple, composable)
- Chart.js with react-chartjs-2
- D3.js (for custom complex charts)
- Victory (for mobile-optimized charts)
```

**Animation:**
```
- Framer Motion (declarative, powerful)
- React Spring (physics-based)
- CSS transitions (for simple cases)
```

**File Upload:**
```
- React Dropzone
- Custom drag-drop with HTML5 API
```

**UI Components:**
```
- Radix UI (headless, accessible)
- Shadcn UI (TailwindCSS components)
- Custom components following design system
```

### Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── StatsBar.tsx
│   │   └── MainLayout.tsx
│   ├── predictions/
│   │   ├── FailurePredictionsCard.tsx
│   │   ├── MaintenanceSchedulingCard.tsx
│   │   ├── PartsForecastingCard.tsx
│   │   └── PredictionCard.tsx (base)
│   ├── weights/
│   │   ├── WeightPanel.tsx
│   │   ├── SystemCategory.tsx
│   │   ├── WeightSlider.tsx
│   │   └── ImpactPreview.tsx
│   ├── upload/
│   │   ├── ContextUpload.tsx
│   │   ├── DropZone.tsx
│   │   └── FileItem.tsx
│   ├── fleet/
│   │   ├── FleetOverview.tsx
│   │   ├── TankCard.tsx
│   │   └── FleetFilters.tsx
│   ├── tank/
│   │   ├── SingleTankView.tsx
│   │   ├── TankHeader.tsx
│   │   ├── SystemHealthChart.tsx
│   │   ├── FailureTimeline.tsx
│   │   └── SystemBreakdown.tsx
│   ├── bot/
│   │   ├── AIAssistant.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── ChatMessage.tsx
│   │   └── QuickActions.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Slider.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
├── hooks/
│   ├── usePredictions.ts
│   ├── useWeights.ts
│   ├── useFileUpload.ts
│   └── useAIChat.ts
├── stores/
│   ├── viewStore.ts
│   ├── weightsStore.ts
│   ├── tanksStore.ts
│   └── chatStore.ts
├── utils/
│   ├── calculations.ts
│   ├── formatting.ts
│   └── constants.ts
├── types/
│   ├── tank.types.ts
│   ├── prediction.types.ts
│   └── ui.types.ts
└── styles/
    ├── globals.css
    └── theme.ts
```

### Key Type Definitions

```typescript
// Tank System Categories
type TankSystem = 
  | 'POWERTRAIN'
  | 'SUSPENSION'
  | 'WEAPONS'
  | 'ARMOR'
  | 'ELECTRICAL'
  | 'FIRE_CONTROL'
  | 'COMMUNICATION'
  | 'HYDRAULICS'
  | 'CREW_SYSTEMS'
  | 'AMMUNITION';

// Prediction Types
interface FailurePrediction {
  system: TankSystem;
  component: string;
  riskScore: number; // 0-100
  estimatedFailure: {
    minDays: number;
    maxDays: number;
  };
  confidence: number; // 0-100
  severity: 'critical' | 'warning' | 'info';
  recommendations: string[];
}

interface MaintenanceTask {
  id: string;
  system: TankSystem;
  title: string;
  priority: {
    urgency: number; // 1-5
    importance: number; // 1-5
  };
  estimatedDuration: number; // hours
  scheduledDate?: Date;
  partsReady: boolean;
  status: 'pending' | 'scheduled' | 'overdue' | 'completed';
}

interface PartsRequirement {
  id: string;
  name: string;
  quantity: number;
  inStock: number;
  needByDate: Date;
  leadTimeDays: number;
  supplier: string;
  cost: number;
  alternatives?: string[];
  status: 'in_stock' | 'on_order' | 'need_to_order';
}

// Weight Configuration
interface WeightConfig {
  systems: Record<TankSystem, {
    weight: number; // 0-100
    components: Record<string, number>;
  }>;
  presetName: 'balanced' | 'defensive' | 'offensive' | 'custom';
}

// Tank Data
interface Tank {
  id: string;
  model: string;
  status: 'operational' | 'maintenance' | 'critical' | 'offline';
  healthScore: number; // 0-100
  location: string;
  operatingHours: number;
  lastService: Date;
  nextService: Date;
  alerts: number;
  systemHealth: Record<TankSystem, number>;
}

// View State
type ViewMode = 'fleet' | 'single';
interface ViewState {
  mode: ViewMode;
  selectedTankId?: string;
  filters: {
    status: string[];
    systems: TankSystem[];
  };
  sortBy: 'riskScore' | 'lastMaintenance' | 'operatingHours';
}
```

### State Management Example (Zustand)

```typescript
// stores/weightsStore.ts
import create from 'zustand';

interface WeightsStore {
  weights: WeightConfig;
  updateSystemWeight: (system: TankSystem, weight: number) => void;
  updateComponentWeight: (system: TankSystem, component: string, weight: number) => void;
  setPreset: (preset: string) => void;
  resetWeights: () => void;
}

export const useWeightsStore = create<WeightsStore>((set) => ({
  weights: defaultWeights,
  updateSystemWeight: (system, weight) =>
    set((state) => ({
      weights: {
        ...state.weights,
        systems: {
          ...state.weights.systems,
          [system]: {
            ...state.weights.systems[system],
            weight
          }
        },
        presetName: 'custom'
      }
    })),
  // ... other methods
}));
```

### Performance Optimizations

**1. Code Splitting:**
```typescript
// Lazy load heavy components
const AIAssistant = lazy(() => import('./components/bot/AIAssistant'));
const DetailedCharts = lazy(() => import('./components/charts/DetailedCharts'));
```

**2. Memoization:**
```typescript
// Expensive calculations
const predictionResults = useMemo(() => 
  calculatePredictions(tankData, weights),
  [tankData, weights]
);

// Prevent unnecessary re-renders
const TankCard = memo(({ tank }) => {
  // component code
});
```

**3. Virtual Scrolling:**
```typescript
// For large fleet lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tanks.length}
  itemSize={120}
>
  {TankRow}
</FixedSizeList>
```

**4. Debouncing:**
```typescript
// Weight adjustments
const debouncedUpdate = useDebouncedCallback(
  (weights) => recalculatePredictions(weights),
  500
);
```

### Accessibility Implementation

**Keyboard Navigation:**
```typescript
// Tab order management
<div
  role="tablist"
  aria-label="Tank systems"
  onKeyDown={handleKeyboardNav}
>
  <button
    role="tab"
    aria-selected={isActive}
    tabIndex={isActive ? 0 : -1}
  >
    Powertrain
  </button>
</div>
```

**Screen Reader Support:**
```typescript
<div
  role="alert"
  aria-live="assertive"
  className="sr-only"
>
  {alertMessage}
</div>

<button aria-label="Expand failure predictions card">
  <ExpandIcon aria-hidden="true" />
</button>
```

**Focus Management:**
```typescript
// Trap focus in modal
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <Modal>
    {/* content */}
  </Modal>
</FocusTrap>
```

### Testing Strategy

**Unit Tests:**
- Component rendering
- User interactions
- Utility functions
- State management

**Integration Tests:**
- User flows (weight adjustment → prediction update)
- File upload process
- View transitions

**Visual Regression:**
- Component screenshots
- Different states (loading, error, success)
- Responsive layouts

**Accessibility Tests:**
- axe-core integration
- Keyboard navigation
- Screen reader testing

### Browser Support

**Target Browsers:**
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest version

**Progressive Enhancement:**
- Core functionality without JS (static view)
- CSS Grid with flexbox fallback
- Modern JS with transpilation
- WebP images with fallbacks

---

## Appendix A: ASCII Wireframe Gallery

### Full Desktop Layout (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  🛡️  Morv AI - Predictive Insights           [Fleet ◐ Single]      [⚙️] [👤]        │
└─────────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Home > Dashboard > Predictive Insights > Fleet Overview                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐                    │
│  │    12    │ │    3     │ │    8     │ │  Last Updated:     │                    │
│  │  Tanks   │ │ Critical │ │ Warnings │ │  2 minutes ago  🔄 │                    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
┌───────────┬─────────────────────────────────────────────────────────────────────────┐
│           │                                                                         │
│  WEIGHTS  │  ┌─────────────────────┐ ┌─────────────────────┐ ┌──────────────────┐ │
│  [≡] [✕]  │  │ ⚠️  FAILURE PRED.   │ │ 🔧 MAINT. SCHED.   │ │ 📦 PARTS FORE.  │ │
│           │  │                     │ │                    │ │                 │ │
│ Presets:  │  │   ┌──────────┐      │ │  Priority Matrix   │ │  Inventory:     │ │
│ [Balanced]│  │   │    67    │      │ │  ┌───┬───┐         │ │  ━━━━●━━━━━     │ │
│ [Defense] │  │   │   High   │      │ │  │ 2 │ 1 │ Urg.    │ │  72% Ready      │ │
│ [Offense] │  │   │   Risk   │      │ │  ├───┼───┤         │ │                 │ │
│ [Custom]  │  │   └──────────┘      │ │  │ 5 │ 2 │ Routine │ │  Critical: 2    │ │
│           │  │                     │ │  └───┴───┘         │ │  parts needed   │ │
│ Systems:  │  │  Critical (30d):    │ │                    │ │                 │ │
│           │  │  🔴 Suspension      │ │  Next 3 Tasks:     │ │  [View List]    │ │
│ ▼ POWERTR │  │  🟡 Transmission    │ │  • Suspension Insp │ │  [Order Parts]  │ │
│   Engine  │  │                     │ │  • Oil Change      │ │                 │ │
│   ━━━○─── │  │  [View All →]       │ │  • Filter Replace  │ │                 │ │
│   Trans.  │  │                     │ │                    │ │                 │ │
│   ━━○──── │  │                     │ │  [View Calendar →] │ │                 │ │
│   Cooling │  │                     │ │                    │ │                 │ │
│   ━○───── │  └─────────────────────┘ └─────────────────────┘ └──────────────────┘ │
│           │                                                                         │
│ ▶ SUSPENS │  ┌─────────────────────────────────────────────────────────────────┐  │
│ ▶ WEAPONS │  │  📄 UPLOAD ADDITIONAL CONTEXT                                   │  │
│ ▶ ARMOR   │  │  ┌───────────────────────────────────────────────────────────┐  │  │
│ ▶ ELECTRI │  │  │                                                           │  │  │
│ ▶ FIRE CO │  │  │              📁                                           │  │  │
│ ▶ COMMUNI │  │  │     Drag & drop files here or click to browse             │  │  │
│ ▶ HYDRAUL │  │  │     Supported: .pdf, .csv, .xlsx, .json, .txt            │  │  │
│ ▶ CREW SY │  │  │                                                           │  │  │
│ ▶ AMMUNTI │  │  └───────────────────────────────────────────────────────────┘  │  │
│           │  │  Recently: maintenance_log.csv [Processing...] sensor.json [✓]  │  │
│ Total:    │  └─────────────────────────────────────────────────────────────────┘  │
│ 100% ✓    │                                                                         │
│           │  ┌─────────────────────────────────────────────────────────────────┐  │
│ Impact:   │  │  FLEET OVERVIEW              [Grid ⊞] [List ≡]  [Filter] [Sort] │  │
│ +12% Susp │  ├─────────────────────────────────────────────────────────────────┤  │
│ -5% Crew  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│           │  │  │ A-001    │ │ A-002    │ │ A-003    │ │ A-004    │          │  │
│ [Reset]   │  │  │  ┌────┐  │ │  ┌────┐  │ │  ┌────┐  │ │  ┌────┐  │          │  │
│ [Apply]   │  │  │  │ 92 │  │ │  │ 67 │  │ │  │ 45 │  │ │  │ 28 │  │          │  │
│           │  │  │  └────┘  │ │  └────┘  │ │  └────┘  │ │  └────┘  │          │  │
└───────────┤  │  │ ✓ 0 Alrt │ │ ⚠ 3 Alrt │ │ 🔴 7Alrt │ │ ✓ 1 Alrt │          │  │
            │  │  │ [Detail] │ │ [Detail] │ │ [Detail] │ │ [Detail] │          │  │
            │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │  │
            │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
            │  │  │ A-005... │ │ A-006... │ │ A-007... │ │ A-008... │          │  │
            │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │  │
            │  └─────────────────────────────────────────────────────────────────┘  │
            │                                                                         │
            └─────────────────────────────────────────────────────────────────────────┘
                                                                            ┌────────┐
                                                                            │  💬    │
                                                                            │   ●    │
                                                                            └────────┘
```

---

## Appendix B: Color Usage Examples

### Status Colors in Context

**Critical/Red (#FF4444):**
- Failed predictions
- Overdue maintenance
- Parts unavailable with urgent need
- Battery voltage critical
- Health scores < 40%

**Warning/Yellow (#FFB627):**
- Upcoming failures (7-30 days)
- Maintenance due soon
- Parts stock low
- Health scores 40-70%
- Trends moving downward

**Success/Green (#00D68F):**
- Good health status (>70%)
- Tasks completed
- Parts in stock
- No issues detected
- Successful uploads

**Info/Blue (#4DA3FF):**
- Informational messages
- Processing status
- Bot messages
- Helpful tips
- Non-urgent notifications

### Gradient Examples

**Risk Score Gauge:**
```
0-30:   #00D68F → #7FE3B4 (Green gradient)
31-60:  #FFB627 → #FFD97E (Yellow gradient)
61-100: #FF4444 → #FF7777 (Red gradient)
```

**Loading Skeleton:**
```
#2D3548 → #3D4558 → #2D3548 (Shimmer effect)
```

**Chart Data:**
```
Line 1: #00A3FF (Primary)
Line 2: #00D68F (Secondary)
Line 3: #FFB627 (Tertiary)
Area fill: rgba(0, 163, 255, 0.1)
```

---

## Appendix C: Component Props Reference

### WeightPanel Component

```typescript
interface WeightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  weights: WeightConfig;
  onWeightChange: (system: TankSystem, value: number) => void;
  onPresetSelect: (preset: string) => void;
  impactPreview: {
    system: TankSystem;
    delta: number;
  }[];
}
```

### TankCard Component

```typescript
interface TankCardProps {
  tank: Tank;
  onClick: (tankId: string) => void;
  viewMode: 'grid' | 'list';
  showActions?: boolean;
  isSelected?: boolean;
}
```

### PredictionCard Component

```typescript
interface PredictionCardProps {
  type: 'failure' | 'maintenance' | 'parts';
  data: FailurePrediction[] | MaintenanceTask[] | PartsRequirement[];
  onExpand: () => void;
  isLoading?: boolean;
  lastUpdated: Date;
}
```

### AIAssistant Component

```typescript
interface AIAssistantProps {
  onHighlight: (componentId: string) => void;
  contextData: {
    currentView: ViewMode;
    selectedTank?: string;
    recentActions: string[];
  };
  isMinimized: boolean;
  onToggleMinimize: () => void;
}
```

---

## Appendix D: Animation Specifications

### Transition Timing Functions

```css
/* Easing curves */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Durations */
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-medium: 300ms;
--duration-slow: 400ms;
```

### Specific Animations

**Card Hover:**
```css
.card {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}
```

**Panel Slide:**
```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Pulse (for alerts):**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

**Shimmer (for loading):**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

---

## Appendix E: Responsive Breakpoint Details

### Mobile Portrait (320px - 479px)

```
- Single column
- Stack all cards
- Hide weight panel (modal only)
- Simplified charts
- Bottom nav bar
- 16px horizontal padding
```

### Mobile Landscape (480px - 767px)

```
- 2-column grid for fleet cards
- Horizontal scroll for wide tables
- Side drawer for filters
- Compressed header
```

### Tablet (768px - 1023px)

```
- 2-3 column layouts
- Weight panel as modal
- Touch-optimized controls (44px min)
- Collapsible sections
```

### Desktop (1024px - 1439px)

```
- Full layout with sidebar
- 3-column prediction cards
- 3-4 column fleet grid
- Hover interactions enabled
```

### Large Desktop (1440px+)

```
- Max-width container (1600px)
- Generous spacing
- 4-column fleet grid
- Side-by-side comparisons
```

---

## Conclusion

This UI design document provides a comprehensive blueprint for implementing the Predictive Insights page. The design prioritizes:

1. **Clarity**: Information hierarchy ensures critical data is immediately visible
2. **Flexibility**: Weight adjustment system allows customized predictions
3. **Intelligence**: AI assistant provides contextual help and insights
4. **Efficiency**: Quick access to fleet and tank-specific data
5. **Modern UX**: Dark theme, smooth animations, responsive design

**Next Steps:**
1. Review and approve design
2. Create Figma/Sketch prototypes (optional)
3. Develop component library
4. Implement core features
5. Integrate with backend API
6. User testing and iteration

**Design Decisions Rationale:**
- Dark theme: Reduces eye strain during long monitoring sessions
- Minimalism: Avoids overwhelming users with data
- Hierarchical weights: Allows both high-level and detailed control
- AI assistant: Reduces learning curve and provides contextual help
- Dual views: Accommodates both fleet management and detailed analysis needs

This design creates a powerful, user-friendly interface for tank maintenance analytics while maintaining the flexibility to evolve as requirements change.

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Created By:** Morv AI Design Team

