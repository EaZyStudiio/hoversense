# HoverSense Native Platform Ports

This directory contains standalone, native implementations of the HoverSense spatial hover interaction model for non-web platforms.

Each port implements the exact mathematical equations, biomechanical safe-zone filtering, intent accumulation, and channel arbitration without any external dependencies.

## Directory Structure

- **`python/`**: Pure Python reference implementation for data analysis, simulation, PyGame, or machine learning pipelines.
- **`kotlin/`**: Kotlin implementation designed for modern Android applications (Jetpack Compose and Android Views).
- **`java/`**: Java implementation compatible with Android API 21+ and generic JVM environments.
- **`cpp/`**: Header-only C++17/C++20 implementation suitable for game engines (Unreal Engine, Godot, custom C++ frameworks) and embedded Linux touchscreens.
- **`rust/`**: High-performance Rust crate implementation for native apps, Bevy, Wasm, and embedded systems.

## Mathematical Equivalence

All ports adhere to the [HoverSense Mathematical Specification](../docs/SPECIFICATION.md) and produce identical numerical outputs within standard 64-bit floating-point precision ($10^{-9}$).
