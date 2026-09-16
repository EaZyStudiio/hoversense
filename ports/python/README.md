# HoverSense for Python

Pure Python implementation of the HoverSense spatial interaction model with zero dependencies.

## Usage

```python
import hoversense_math as hm

# 1. Define candidate items
items = [
    hm.MeasuredItem(id="card-1", rect=hm.Rect(left=20, right=180, top=100, bottom=220)),
    hm.MeasuredItem(id="card-2", rect=hm.Rect(left=200, right=360, top=100, bottom=220)),
]

# 2. Resolve screen anchor channel
screen_cfg = hm.ScreenConfig(anchor_ratio=0.42, band_ratio=0.30)
hits = hm.resolve_screen(items, vw=390, vh=844, cfg=screen_cfg)

for hit in hits:
    print(f"Item: {hit.id}, Strength: {hit.strength:.2f}")

# 3. Handle touch engagement
touch_cfg = hm.TouchConfig()
hit_target = hm.get_hit_under_point(hm.Point(x=100, y=160), items, touch_cfg)
print(f"Touched item: {hit_target}")
```

## Running Verification

```bash
python -c "import hoversense_math as hm; print('Smooth:', hm.smooth(0.5))"
```
