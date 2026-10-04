# Jalora — AI/ML Drinking-Water Supply Monitoring Dashboard (JJM PS 26255)

> **Regulatory Notice & Disclaimers:**
> - **Simulated data:** All telemetry, pressures, flows, water quality indices, and citizen grievance volumes are procedurally generated in-app using a seeded deterministic PRNG (Mulberry32).
> - **Mock API - integration-ready:** Upstream IMIS and Sujal Gaon integration interfaces are mock adapters providing production-ready data contracts and idempotent retry mechanisms.
> - **Water Quality Notice:** Within configured limits (not a safety certification). Low-cost electronic sensors cannot establish microbiological safety; statutory potable certification requires certified laboratory incubation.

---

## 1. Quick Start & Scripts

The application is built with **Vite + React 19 + TypeScript (strict) + Tailwind CSS + Recharts + Lucide + Zustand + Vitest**. It operates completely client-side without external network calls, CDN links, map tiles, or API keys.

```bash
# Install dependencies
npm install

# Start local development server (http://127.0.0.1:5173/)
npm run dev

# Run strict type checking and ESLint
npm run lint

# Run Vitest automated unit test suite
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 2. Network Topology ("Demo Village")

The schematic models 20 household tap connections (FHTC) fed by an overhead gravity tank:
- **Nodes (9):** `TANK`, `T0` (Sensor), `J1` (Sensor), `J2` (Sensor), `E1` (Tail End Sensor), `A1`, `C1`, `B1` (Sensor), `B2` (Sensor).
- **Pipe Segments (8):**
  - `S1`: TANK &rarr; T0 (feeds no taps directly)
  - `S2`: T0 &rarr; J1 (feeds `H01`)
  - `S3`: J1 &rarr; J2 (feeds `H02`, `H03`, `H04`)
  - `S4`: J2 &rarr; E1 (feeds `H05`)
  - `S5`: J1 &rarr; A1 (feeds `H06`, `H07`)
  - `S6`: J2 &rarr; C1 (feeds `H08`, `H09`)
  - `S7`: J1 &rarr; B1 (feeds `H10`, `H11`)
  - `S8`: B1 &rarr; B2 (feeds `H12` &ndash; `H20`, 9 households)
- **Supply Schedule:** Two daily windows: **06:00&ndash;08:00** and **17:00&ndash;19:00**. Outside these windows, pumps are idle and zero flow is standard operating procedure (never flagged as an alert).

---

## 3. AI/ML Diagnostic Engine & Formulas

### 1. Rolling MAD Baselines & Robust Z-Scores
Baselines are maintained per sensor, parameter (flow, pressure), and supply window:
$$\text{Robust } z = \frac{|x - \text{median}|}{1.4826 \times \text{MAD}}$$
A deviation is flagged only when robust $z > 3.5$ for 3 consecutive samples inside an active supply window.

### 2. Segment Failure Hypotheses & Signatures
- **Blockage:** Severe drop in downstream flow ($<-35\%$), upstream backpressure rise ($>+8\%$), and downstream pressure drop.
- **Leak:** Inflow higher than outflow across segment, coupled with downstream pressure drop ($>-20\%$).

### 3. Fusion Scoring Formula
$$S(e) = w_1 F(e) + w_2 P(e) + w_3 C(e)$$
- $F(e) \in [0, 1]$: Flow deviation similarity to failure signature.
- $P(e) \in [0, 1]$: Pressure deviation similarity.
- $C(e) \in [0, 1]$: Weighted Jaccard index between predicted affected households and citizen complaints, weighted by GPS validity (inside 50m = 1.0, outside = 0.3) and reporting reliability:
  $$J(e) = \frac{\sum_{h \in H_{\text{pred}} \cap H_{\text{comp}}} w(h)}{\sum_{h \in H_{\text{pred}} \cup H_{\text{comp}}} w(h)}$$
- Default weights: $w_1 = 0.35, w_2 = 0.25, w_3 = 0.40$ (configurable in Settings and auto-normalized).

### 4. Confidence Bands & Rules
$$\text{Confidence}(e) = \frac{S(e)}{\sum_{k} S(k)}$$
- **High:** $\ge 60\%$
- **Moderate:** $35\% - 59\%$
- **Low:** $< 35\%$
- **Rules:**
  - Zero complaints caps confidence at **Moderate** ($<60\%$).
  - An abnormal sensor with zero complaints is classified as an **Unresolved Anomaly** requiring a sensor-health check (not a pipe break).
  - Series segments without intermediate sensors with scores within 10% show an **Indistinguishable** badge.

### 5. FHTC Household Service Score
$$\text{Score} = 100 \times (0.35 \times \text{Supply} + 0.25 \times \text{FlowPressure} + 0.20 \times \text{Complaints} + 0.20 \times \text{History})$$
- $\ge 75$: **Functional** (Green)
- $40 - 74$: **At Risk** (Amber)
- $< 40$: **Non-functional** (Rose)
- **Outage Propagation:** If any segment upstream from the tank fails, downstream households are forced to **Non-functional** ($<40$).

---

## 4. Key Features & Acceptance Verification

1. **Overview Page (P0):**
   - KPI metrics (Functional, At Risk, Non-functional, Average Score, Active Incidents, Online Sensors).
   - Interactive SVG schematic with color-coded household squares, diamond sensors, and pulsing X on fault location.
   - Explainable Alert Card showing evidence bullets with computed values, confidence band, top-3 ranked bars, and formula breakdown.
   - Live telemetry chart (Recharts) with flow and pressure vs baseline.
2. **Households Page (P0):**
   - Searchable, filterable, sortable table for all 20 connections.
   - Score breakdown drawer showing all 4 component weights.
   - One-click CSV export with complete FHTC metadata.
3. **Incidents Page (P0):**
   - Kanban board (Detected &rarr; Localized &rarr; Assigned &rarr; In repair &rarr; Citizen confirmed &rarr; Closed).
   - Mock technician assignment, "Mark Repaired" (restores flow), and "Citizen Confirmed" (closes ticket and restores scores).
4. **Citizen Grievance Reports (P0):**
   - Mobile-optimized grievance form with GPS geofencing validation (<50m vs >50m).
   - Duplicate prevention: reports from same household + issue within 60 simulated minutes merge automatically.
   - Offline queue mode with "Pending Sync" and one-click synchronization.
5. **Water Quality Page (P1):**
   - 5 parameters (pH, Turbidity, TDS, Conductivity, Residual Chlorine) with BIS IS 10500 limits.
   - Field/lab verification pass/fail workflow.
6. **Predictive Maintenance Risk (P1):**
   - Prioritized segment inspection ranking with risk points and drivers ($S7 = \text{High}, S4 = \text{Medium}$).
7. **IMIS Gateway (P1):**
   - Official mock ID registry, idempotency tracking, and manual retry.
8. **Role Switcher & Localization (P2):**
   - Villager view ("My Tap Status" + quick report button).
   - State view (matrix of 6 mock villages with status counts and click-through).
   - Multilingual support (English, Tamil, Hindi).
   - Dark mode toggle with persistent classes.

---

## 5. Assumptions

1. **Supply Windows:** Fixed at 06:00-08:00 AM and 17:00-19:00 PM; outside these windows pumps are turned off to prevent dry-running.
2. **Deterministic Seed:** PRNG is seeded with integer `26255` (JJM Problem Statement ID) for exact repeatability across test environments.
3. **GPS Distance:** Household taps are assumed fixed; reports submitted from $>50\text{m}$ radius are downweighted from 1.0 to 0.3.
4. **Water Quality Limits:** BIS IS 10500:2012 defaults (pH 6.5-8.5, Turbidity $\le 5$ NTU, TDS $\le 500$ ppm, Residual Chlorine 0.2-1.0 mg/L).
