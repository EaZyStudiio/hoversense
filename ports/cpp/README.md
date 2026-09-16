# HoverSense for C++

Header-only C++17/C++20 mathematical foundation for HoverSense.

## Integration

Drop `hoversense_math.hpp` into your project's include directory:

```cpp
#include "hoversense_math.hpp"
#include <iostream>

int main() {
    hoversense::Point pt{120.0, 240.0};
    hoversense::Rect box{100.0, 200.0, 200.0, 300.0};

    double dist = hoversense::distToRect(pt, box);
    std::cout << "Distance to target: " << dist << "px\n";
    return 0;
}
```

## Ideal For

- Unreal Engine 5 Slate / UMG UI systems.
- Custom game engine HUDs and touch interfaces.
- Embedded Qt / Wayland touch kiosk displays.
