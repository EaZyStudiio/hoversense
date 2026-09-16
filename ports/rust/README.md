# HoverSense Math (Rust)

Pure Rust implementation of the HoverSense spatial interaction model.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
hoversense-math = { path = "ports/rust" }
```

## Usage

```rust
use hoversense_math::{Point, Rect, dist_to_rect, smooth};

fn main() {
    let pt = Point { x: 50.0, y: 50.0 };
    let rect = Rect { left: 10.0, right: 40.0, top: 10.0, bottom: 40.0 };

    let dist = dist_to_rect(pt, rect);
    println!("Distance: {:.2}px", dist);
}
```
