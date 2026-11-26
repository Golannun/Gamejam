# 山洞祭坛素材

地面 `stone-floor.png` 铺在底层，透明岩壁 `rear-rock-wall.png` 叠在地图后沿。场景内三个调查位保持原 Demo 的坐标。

| 文件 | 用途 |
| --- | --- |
| `altar-coin.png` | 祭坛铜钱 (10,5) |
| `wall-marks.png` | 石壁刻痕 (5,3) |
| `offering-register.png` | 献祭名册 (15,7) |
| `cave-entrance.png` | 旧居至山洞的过渡点，可与旧居出口 (18,8) 对齐 |
| `paper-and-coins.png` | 纸屑和散落铜钱装饰，可放在通道外 |
| `../ui/investigate-marker.png` | 从参考图 A 单独提取的放大镜标记，指针底端对齐调查物上方 |

调查物按底边中点对齐各格。视觉层与点击范围独立，保留相邻可调查格，并复用原 Demo 的背包和调查完成状态。
