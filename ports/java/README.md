# HoverSense for Java

Pure Java implementation of HoverSense compatible with Android API 21+ and generic JVM environments.

## Usage

```java
import studio.eazy.hoversense.math.HoverSenseMath;
import studio.eazy.hoversense.math.HoverSenseMath.Point;
import studio.eazy.hoversense.math.HoverSenseMath.Rect;
import studio.eazy.hoversense.math.HoverSenseMath.TouchConfig;

TouchConfig config = new TouchConfig();
Point pt = new Point(touchX, touchY);
String hitId = HoverSenseMath.getHitUnderPoint(pt, items, config);
```
