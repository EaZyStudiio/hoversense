# HoverSense for Android & Kotlin

Native Kotlin implementation of HoverSense for Jetpack Compose and Android Views.

## Usage in Jetpack Compose

```kotlin
import studio.eazy.hoversense.math.HoverSenseMath
import studio.eazy.hoversense.math.Point
import studio.eazy.hoversense.math.Rect
import studio.eazy.hoversense.math.TouchConfig

val touchConfig = TouchConfig()
val touchPoint = Point(touchEvent.x.toDouble(), touchEvent.y.toDouble())

val hitId = HoverSenseMath.getHitUnderPoint(touchPoint, registeredItems, touchConfig)
```

## Features

- Works directly with Compose `Modifier.onGloballyPositioned` to measure layout bounds.
- Full support for Android gesture velocity, multi-touch filtering, and system edge exclusions.
