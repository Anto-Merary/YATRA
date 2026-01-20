# YATRA 2026 - Site Structure Documentation

This document provides a comprehensive overview of all pages and sections available in the YATRA 2026 website.

## Table of Contents
- [Main Pages](#main-pages)
- [Event Pages](#event-pages)
- [Special Pages](#special-pages)
- [Navigation Structure](#navigation-structure)
- [Page Sections](#page-sections)

---

## Main Pages

### 1. Home Page (`/`)
**Route:** `/`  
**Component:** `HomePage.tsx`

The main landing page featuring multiple sections:

#### Sections:
1. **Hero Section**
   - Full-screen video background with parallax effect
   - 3D interactive YATRA logo (ThreeLogo component)
   - Call-to-action buttons: "Buy Tickets" and "Register Events"
   - Scroll indicator
   - Light rays animation effect
   - Institution name: "RAJALAKSHMI INSTITUTE OF TECHNOLOGY"

2. **Dynamic Marquee Section**
   - Animated scrolling text: "YATRA '26 • FEB 14-15 •"
   - Continuous loop animation

3. **About Section**
   - **About YATRA**: Information about the cultural fest
   - **About RIT**: Information about Rajalakshmi Institute of Technology
   - Two-column layout with modern cards

4. **Stats/Highlights Section**
   - Animated counters displaying:
     - Number of Events (50+)
     - Number of Days (2)
     - Number of Categories (15+)
   - Spotlight cards with gradient borders

5. **Featured Events Preview**
   - Grid display of first 4 events from the events list
   - Event cards showing:
     - Event name
     - Day (Day 1 or Day 2)
     - Participation type (Solo or Group)
     - Description preview
   - "View All Events" button linking to `/events`

6. **Proshow Section**
   - Featured artist: **AOORA - LIVE IN CONCERT**
   - Artist image with tilted card effect
   - Description of the K-Pop performance
   - "View Details" button linking to `/proshow`

7. **Gallery Section - "Moments of YATRA"**
   - Full-screen grid motion gallery
   - Displays images from `/assets/Gallery/` directory
   - Interactive grid animation

**Mobile Version:** Uses `MobileHomePage.tsx` component for screens < 768px

---

### 2. Proshow Page (`/proshow`)
**Route:** `/proshow`  
**Component:** `ProshowPage.tsx`

Dedicated page for the proshow event featuring:

- **Hero Section**: Artist introduction with decryption text effect
- **Artist Information**: Details about AOORA performance
- **Visual Effects**: Terminal-style animations, glitch effects
- **Event Details**: Date, time, venue information
- **Registration/Booking**: Links to ticket purchase

---

### 3. Tickets Page (`/tickets`)
**Route:** `/tickets`  
**Component:** `TicketsPage.tsx`

Ticket purchasing and registration page featuring:

#### Ticket Types:
1. **Early Bird Ticket**
   - Price: ₹750 (discounted from ₹800)
   - Perks:
     - Yatra Entry Pass
     - Access to 2 DAYS
     - Proshow
     - DJ Night
   - Countdown timer for early bird offer
   - Registration form integration

2. **Event Ticket**
   - Event entry pass
   - Select specific events
   - Only access to events

#### Features:
- Expandable registration form
- Pixel blast animation effects
- Spotlight cards for ticket display
- Responsive design for mobile and desktop

---

### 4. Events Page (`/events`)
**Route:** `/events`  
**Component:** `EventsPage.tsx`

Category selection page with two main event types:

1. **PRO EVENTS**
   - Flagship competitions
   - Separate from main cultural stage
   - Winners perform on main stage
   - Cash prizes
   - Links to `/proevents`

2. **YATRA EVENTS**
   - Main cultural fest events
   - Various categories and competitions
   - Links to `/yatraevents`

**Design:** Large image cards with gradient overlays, hover effects

---

### 5. Pro Events Page (`/proevents`)
**Route:** `/proevents`  
**Component:** `ProEventsPage.tsx`

Displays all professional/competitive events including:

- **Dance Battle** - High-energy dance competition
- Other pro-level competitions
- Event cards with details
- Registration links for each event

---

### 6. Yatra Events Page (`/yatraevents`)
**Route:** `/yatraevents`  
**Component:** `YatraEventsPage.tsx`

Displays all main cultural fest events organized by:

- **Day 1 Events** (30+ events)
- **Day 2 Events** (20+ events)

#### Event Categories Include:
- **Dance**: Solo Dance, Duo Dance, Group Dance, Kids Solo Dance, Classical Dance, Adaptune Solo Battle
- **Music**: Singing, Beatbox Battle, Battle of Bands
- **Gaming**: PUBG, Brawl Stars, Free Fire, Valorant, Stumble Guys
- **Arts & Crafts**: Mehandi, Mega Origami, Pencil Art/Painting, Rangoli, Poster Designing, Face Fiesta
- **Performance**: RJ Hunt, Mime, Mono Acting, Stand-Up Comedy, Channel Surfing
- **Intellectual**: Brain Teasers Arena, K-Drama vs Anime Quiz, Lyric Quest, JAM, Debate, Oratory
- **Sports & Games**: Box Cricket, Tug of War, Red Light Green Light, Balloon Bursting Challenge, Gonggi
- **Creative**: Meme Creation Challenge, Avatar Portfolio, Short Film, Photography, Bioscope
- **Special**: Cricket Commentary, AdZap, Mock Parliament, Treasure Hunt, Tower Build, Fake News or Fact, Tongue Twister Tournament, The Opposite, Laughing Challenge, Ethnic Food Contest

Each event card shows:
- Event name
- Day (Day 1 or Day 2)
- Participation type (Solo/Group)
- Description
- Link to detailed event page

---

### 7. Event Detail Page (`/events/:eventId`)
**Route:** `/events/:eventId`  
**Component:** `EventDetailPage.tsx`

Individual event detail page showing:

- **Event Information**:
  - Full event name
  - Day and time
  - Venue
  - Participation type
  - Detailed description

- **Rules Section**:
  - Complete list of event rules
  - Participation guidelines
  - Time limits
  - Judging criteria

- **Contact Information**:
  - Organizer name
  - Organizer phone number
  - Contact email (if available)

- **Registration**:
  - Google Form registration link
  - Call-to-action button

- **Visual Design**:
  - Background variants (eventinfo or eventinfo2)
  - Event-specific styling
  - Responsive layout

---

### 8. Mr. & Ms. Yatra Page (`/events/mr-ms-yatra`)
**Route:** `/events/mr-ms-yatra`  
**Component:** `MrMsYatraPage.tsx`

Special event page for the Mr. & Ms. Yatra competition featuring:

- Competition details
- Rules and guidelines
- Registration information
- Special styling and animations

---

### 9. Pro Dance Battle Page (`/pro-dance-battle`)
**Route:** `/pro-dance-battle`  
**Component:** `ProDanceBattlePage.tsx`

Dedicated page for the professional dance battle event with:

- Event details
- Competition format
- Rules and regulations
- Registration links

---

### 10. Team Page (`/team`)
**Route:** `/team`  
**Component:** `TeamPage.tsx`

Team members and organizers page featuring:

#### Team Categories:
1. **Faculty Coordinators**
   - Faculty members organizing the event

2. **Student Coordinators**
   - Student organizers and coordinators

3. **Web Development Team**
   - Christopher (ft.chrizzy) - Web Developer
   - Anto Merary (antomerary.png) - Web Developer
   - Instagram profile links

#### Features:
- Filter system (All, Faculty, Student, Web Dev)
- Profile cards with animations
- Auto-scroll functionality
- Stars background animation
- Letter glitch effects
- Responsive grid layout

---

### 11. Admin Page (`/admin`)
**Route:** `/admin`  
**Component:** `AdminPage.tsx`

Administrative dashboard (separate from main site layout) featuring:

- **Admin Dashboard Component**
- Ticket management
- Registration management
- Event administration
- Analytics and reports

**Note:** This page is not accessible through main navigation and requires admin authentication.

---

### 12. 404 Not Found Page (`*`)
**Route:** Any unmatched route  
**Component:** `NotFoundPage.tsx`

Custom 404 error page for invalid routes.

---

## Navigation Structure

### Main Navigation (Navbar)
Located in `Navbar.tsx`, includes:

1. **Home** (`/`) - Home icon
2. **Proshow** (`/proshow`) - Mic icon
3. **Tickets** (`/tickets`) - Ticket icon
4. **Events** (`/events`) - Calendar icon
5. **Team** (`/team`) - Users icon

### Mobile Navigation
- Dock component at bottom of screen
- Icon-based navigation
- Active state indicators

### Footer
Located in `Footer.tsx`:
- Additional links
- Social media links
- Contact information
- Copyright notice

---

## Page Sections Summary

### Common Sections Across Pages:
1. **Hero Sections**: Full-screen introductions with animations
2. **Content Sections**: Main information display
3. **Call-to-Action Sections**: Buttons and registration forms
4. **Gallery/Media Sections**: Image and video displays
5. **Contact/Info Sections**: Organizer details and registration links

### Reusable Components:
- **ThreeLogo**: 3D interactive logo
- **SpotlightCard**: Card component with spotlight effect
- **ModernCard**: Modern styled card container
- **RainbowButton**: Animated gradient button
- **TextHoverEffect**: Interactive text effects
- **ScrollReveal**: Scroll-triggered animations
- **GridMotion**: Animated image grid
- **LightRays**: Light ray animation effects
- **ColorBends**: Background color animation
- **NoiseOverlay**: Texture overlay effects

---

## Event Data Structure

Events are defined in `src/data/events.ts` with the following structure:

```typescript
{
  id: string;
  name: string;
  day: "day1" | "day2";
  participation: "solo" | "group";
  description: string;
  venue: string;
  organizerName: string;
  organizerPhone: string;
  registrationUrl: string;
  rules?: string[];
  date?: string;
  time?: string;
  contactEmail?: string;
  backgroundVariant?: "eventinfo" | "eventinfo2";
}
```

**Total Events:** 50+ events across 2 days

---

## Technical Details

### Routing
- Uses React Router v6
- Route transitions with `RouteTransitionContext`
- Page transitions and animations

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Separate mobile components for complex pages
- Touch-optimized interactions

### Animations
- Framer Motion for page transitions
- Custom scroll animations
- Parallax effects
- 3D interactions (Three.js/React Three Fiber)

### Assets
- Images: `/src/assets/`
- Gallery: `/src/assets/Gallery/`
- Videos: `/src/assets/video.mp4`
- 3D Models: `/YATRA 3D ELEMENT.glb`
- Fonts: Custom fonts in `/src/assets/fonts/`

---

## Notes

- The site uses a dark theme with pink/purple accent colors
- All pages are wrapped in `SiteLayout` component (except Admin page)
- Mobile versions may have simplified layouts for performance
- Event registration links to Google Forms
- Ticket system integrates with registration forms
- Admin page is separate from public navigation

---

*Last Updated: Based on current codebase structure*
