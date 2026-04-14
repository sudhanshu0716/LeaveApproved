# 🧭 Mission Cartography Protocol v2.5
## Technical & Functional Manifest for the Synthesize Chamber

This manifest defines the architectural and interactive specifications for the **Explorer Mission Cartography Suite**. It is designed as a training and prompting reference for AI models to generate, modify, and manage high-fidelity itinerary flows.

---

## 1. Waypoint Registry (Nodes)
Waypoints are the physical anchors of a mission map. Each node type handles a specific logistical category.

### 🏙️ CityNode (Residency Waypoint)
*   **Purpose**: Represents a primary destination where the traveler is staying overnight.
*   **Technical Identifier**: `cityNode`
*   **Data Fields**:
    *   `label` (String): The name of the city/destination.
    *   `color` (Hex): Header background color (Default: #1b4332). **Adaptive Contrast** pivots text between #000 and #fff based on luminance.
    *   `rooms` (String): Hotel or Sanctuary name.
    *   `food` (String): Fine dining or local eats recommendations.
    *   `activity` (String): Primary expedition or sightseeing activity.
*   **Interaction**: Supports dragging, deletion via Right Tool Hub, and incoming/outgoing transit trails.

### Share2 HubNode (Transit Nexus)
*   **Purpose**: Represents a logistical transition point (Airport, Station, Pier) where no stay is involved.
*   **Technical Identifier**: `hubNode`
*   **Data Fields**:
    *   `label` (String): The name of the transit port (e.g., LHR Airport).
    *   `color` (Hex): Header background color (Default: #000).
    *   `arrivalTime` (Time/String): Scheduled docking time.
    *   `departureTime` (Time/String): Scheduled launch time.
*   **Logic**: No Residency input fields; optimized for high-speed logistical transitions.

### 📝 NoteNode (Field Note)
*   **Purpose**: A free-form tactical annotation for general tips, warnings, or budgeting notes.
*   **Technical Identifier**: `noteNode`
*   **Data Fields**:
    *   `label` (String): The note content.
    *   `color` (Hex): Header/accent color (Default: #ffb703).
*   **Logic**: Minimalist architecture for rapid information entry.

### ⛺ StickerNode (Tactical Marker)
*   **Purpose**: Visual stamps used to indicate environmental Intel, weather, or specific mission markers.
*   **Technical Identifier**: `stickerNode`
*   **Data Fields**:
    *   `iconType` (Enum): One of `camera`, `food`, `camp`, `marker`, `sun`, `rain`, `snow`, `danger`.
    *   `size` (Integer): Dimensions in pixels (20px to 120px) controlled by the **MARKER_SCALE** slider.
    *   `color` (Hex): Icon color.
*   **Logic**: Fixed-aspect ratio markers that provide high-density visual intelligence without text fields.

---

## 2. Expedition Trails (Edges)
Trails represent the movement between waypoints.

### ✈️ CustomEdge (Transit Trail)
*   **Purpose**: Connects nodes with logical transit data and visual curving.
*   **Technical Identifier**: `customEdge`
*   **Data Fields**:
    *   `transport` (Enum): Transit mode (`FLIGHT`, `BUS`, `TRAIN`, `CAB`).
    *   `direction` (Enum): `Outbound`, `Return`, or `Connecting`.
    *   `lineStyle` (Enum): `Solid` (Standard) or `Dashed` (Secondary/Alternative).
    *   `customArc` (Integer): Curvature intensity (50 to 600) via the **EXPEDITION_TRAIL_ARC** slider.
    *   `color` (Hex): The stroke color of the path.
*   **Visual Controls**: Logic automatically calculates the `autoOffset` to prevent overlap between nodes when multiple trails exist.

---

## 3. Command HUD & Interactivity
The top-level logic that drives the blueprint generation.

### 🖊️ Expedition Pen (Drawing Mode)
*   **Activation**: Toggled via `setIsDrawingMode`.
*   **Workflow**: 
    1. Select a "**Launch Point**" node (pulses with Amber resonance).
    2. Select a "**Destination Point**" node.
    3. An `Expedition Trail` is automatically forged between them.
*   **UI Influence**: Cursor changes to `crosshair` and the map grid fades for focus.

### 🛡️ Luminance Guard (Adaptive Contrast)
*   **Algorithm**: `brightness = (r*299 + g*587 + b*114) / 1000`.
*   **Behavior**: If `brightness > 128`, the text color pivots to `#000` (Obsidian); otherwise, it defaults to `#fff` (Mission White). Applied to all node headers.

### 🔍 Tactical HUD (Right Tool Hub)
*   **Behavior**: Context-aware panel.
    *   **Node Selection**: Displays `ELEMENT_COLOR` and `MARKER_SCALE` (for stickers).
    *   **Edge Selection**: Displays `TRAIL_ARC`, `TRANSIT_PRESETS`, `TRAIL_STYLE`, and `TRAIL_COLOR`.
    *   **Common Command**: `PURGE_WAYPOINT` or `PURGE_TRAIL` for tactical disposal.

---

## 4. AI Prompting Blueprint (Usage Guide)
To generate a flow using this protocol:
1.  **Define Nodes**: List destinations (CityNodes) and hubs (HubNodes) with their coordinates.
2.  **Define Connections**: forge trails (Edges) between nodes, specifying transit modes and intensities.
3.  **Intelligence Layer**: Drop stickers for weather or photo ops.
4.  **Styling**: Apply colors to categorize different regions or legs of the mission.
