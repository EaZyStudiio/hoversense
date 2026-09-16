# HoverSense Mathematical & Biomechanical Specification

Version: 1.0.0  
Authors: EaZy (https://github.com/EaZyStudiio)  
License: MIT

---

## 1. Overview & Axioms

On physical touch displays, hardware sensors register discrete contact events (touchdown, movement, release) rather than continuous hover vectors. Traditional desktop interfaces rely on continuous mouse coordinate streams to reveal tooltips, elevate cards, and communicate interactivity.

HoverSense formalizes **Spatial Hover** through two orthogonal channels arbitrated by dynamic confidence authority:

1. **The Screen Channel ($C_{\text{screen}}$)**: A passive horizontal gaze anchor line positioned at natural reading elevation ($Y_{\text{anchor}} = 0.42 \times H_{\text{viewport}}$) with continuous cubic Hermite falloff.
2. **The Touch Channel ($C_{\text{touch}}$)**: An active contact channel driven by dual-stream intent accumulation (dwell dwell-time and lateral displacement).

---

## 2. Geometric Distance Metric

For any 2D point $P = (p_x, p_y)$ and an axis-aligned bounding box (AABB) $R$ defined by boundaries $[x_{\min}, x_{\max}] \times [y_{\min}, y_{\max}]$:

$$\Delta x = \max(0, x_{\min} - p_x, p_x - x_{\max})$$
$$\Delta y = \max(0, y_{\min} - p_y, p_y - y_{\max})$$
$$\text{dist}(P, R) = \sqrt{\Delta x^2 + \Delta y^2}$$

### Properties:
- **Interior Points**: If $P \in R$, then $\Delta x = 0$ and $\Delta y = 0$, yielding $\text{dist}(P, R) = 0$.
- **Edge Projections**: If $P$ is directly orthogonal to an edge, distance collapses to standard 1D perpendicular displacement.
- **Diagonal Corners**: If $P$ lies outside two perpendicular edges, distance equals the Euclidean hypotenuse to the corner vertex.

---

## 3. Signal Smoothing: Cubic Hermite Smoothstep

To eliminate discontinuous velocity jumps in visual feedback, all scalar falloff mappings use the standard cubic Hermite smoothstep polynomial:

$$\text{clamp}(v, lo, hi) = \min(\max(v, lo), hi)$$

$$S(t) = 3x^2 - 2x^3 \quad \text{where} \quad x = \text{clamp}(t, 0, 1)$$

### Boundary Conditions:
- $S(0) = 0$ and $S(1) = 1$
- First derivative $S'(x) = 6x - 6x^2$ satisfies $S'(0) = 0$ and $S'(1) = 0$, guaranteeing zero velocity at boundary transitions.

---

## 4. Biomechanical Safe-Zone Vector Field

Touchscreens are handheld physical objects. Resting thumbs and holding palms generate peripheral contact patches that must not trigger accidental hover engagement.

A Safe Zone $Z_k$ is specified in normalized viewport coordinates $[z_{\text{left}}, z_{\text{right}}] \times [z_{\text{top}}, z_{\text{bottom}}]$ with weight $w_k \in [0.0, 1.0]$ and feathering width $F_k > 0$ in pixels.

For viewport dimensions $(W, H)$, physical boundaries are:
$$L = z_{\text{left}} \cdot W, \quad R = z_{\text{right}} \cdot W, \quad T = z_{\text{top}} \cdot H, \quad B = z_{\text{bottom}} \cdot H$$

The signed penetration depth $d(P)$ of touch point $P = (x, y)$ from the nearest outer edge is:
$$d(P) = \min(x - L, R - x, y - T, B - y)$$

The normalized feathered penetration factor $p(P) \in [0.0, 1.0]$ is:
$$p(P) = S\left( \frac{d(P) + F_k / 2}{F_k} \right)$$

The effective zone confidence weight $W(P)$ interpolates smoothly:
$$W(P) = 1.0 + (w_k - 1.0) \cdot p(P)$$

### Posture Sampling Rule:
Zone sampling is evaluated strictly at gesture touchdown $(x_0, y_0)$. A gesture originating in a suppressed zone remains penalized throughout its lifecycle, while intentional content contact receives full confidence.

---

## 5. Dual-Channel Intent Accumulation

Touch engagement intent $I \in [0.0, 1.0]$ fuses two physical vectors:

### 5.1 Hold Channel (Contact Dwell)
Suppressed safe zones penalize gestures by stretching the required hold duration:

$$T_{\text{hold}}(w) = T_{\text{max}} + (T_{\text{min}} - T_{\text{max}}) \cdot w$$

where $T_{\text{min}} = 320\text{ms}$ and $T_{\text{max}} = 1200\text{ms}$.

For elapsed contact duration $\Delta t = t_{\text{current}} - t_0$:
$$I_{\text{hold}} = \text{clamp}\left( \frac{\Delta t}{T_{\text{hold}}}, 0, 1 \right)$$

*Critical Implementation Note*: $I_{\text{hold}}$ must not be scaled by $w$ after division; satisfying the stretched duration $T_{\text{hold}}$ grants full 1.0 intent.

### 5.2 Drag Channel (Lateral Travel)
Vertical displacement on mobile interfaces primarily drives scrolling. Vertical travel is dampened by constant factor $\alpha = 0.22$:

$$D_{\text{eff}} = \sqrt{(\Delta x)^2 + (\Delta y \cdot \alpha)^2}$$

For deadzone $D_0 = 9\text{px}$ and saturation distance $D_1 = 46\text{px}$:
$$I_{\text{drag}} = \text{clamp}\left( \frac{D_{\text{eff}} - D_0}{D_1 - D_0}, 0, 1 \right)$$

### 5.3 Intent Fusion
$$I_{\text{total}} = \text{clamp}\left( \max(I_{\text{hold}}, I_{\text{drag}} \cdot w), 0, 1 \right)$$

If vertical flick is classified as a native scroll ($| \Delta y | > 1.3 |\Delta x|$ within $220\text{ms}$), scroll lock engages permanently ($I_{\text{total}} = 0$).

---

## 6. Edge-Aware Hit Snapping & Gutter Deadzones

When touch coordinates do not fall directly inside any item, proximity resolution determines whether to snap or deselect.

For candidate targets sorted by ascending Euclidean distance $d_1 \le d_2 \le \dots \le d_n$:
- External Margin Cushion: $d_{\text{max}} = 42\text{px}$.
- Inter-Item Gap Allowance: For adjacent items with gap span $G = d_1 + d_2$, snap allowance is:
$$A = \frac{G}{2} \cdot \beta$$
where $\beta \in [0.0, 1.0]$ (default: $0.40$).

The effective snap threshold $D_{\text{snap}}$ is:
$$D_{\text{snap}} = \min(d_{\text{max}}, A)$$

If $d_1 \le D_{\text{snap}}$, item 1 is selected. If $d_1 > D_{\text{snap}}$, touch lands in empty deadzone space and deselects.

---

## 7. Dynamic Channel Arbitration

Screen hits $H_{\text{screen}}$ and Touch latches $H_{\text{touch}}$ are arbitrated by Touch Authority $\Omega \in [0.0, 1.0]$:

$$S_{\text{final}}(item) = \max\left( S_{\text{screen}}(item) \cdot (1 - \Omega), \quad S_{\text{touch}}(item) \cdot \Omega \right)$$

### Authority Release Modes:
- **`scroll`**: Authority decays as scroll displacement from latch $d_{\text{scroll}}$ exceeds $180\text{px}$, reaching $0.0$ at $560\text{px}$:
$$\Omega(d) = 1 - S\left( \frac{d_{\text{scroll}} - 180}{560 - 180} \right)$$
- **`off-screen`**: $\Omega = 1.0$ until the latched item's bounding box exits the viewport bounds ($y_{\max} < 0$ or $y_{\min} > H$).
- **`never`**: $\Omega = 1.0$ until an explicit new touch interaction occurs.
