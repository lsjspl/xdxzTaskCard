# Task List

这里是任务主配置文件。页面现在会优先读取 `task.md`，如果没有再回退到旧的 `tasks.md`。

1. 稀有度标题可以写成 `## Easy [25]`、`## Normal [25]`、`## Hard [25]`、`## Epic [25]`。
1. 推荐新写法是：`任务文本 | bg:背景图 | far:远景层 | mid:中景层 | char:角色层 | front:前景层`
1. `far`、`mid`、`front` 留空时会自动显示占位视觉，方便你先看 3D 错层效果。
1. `bg`、`char` 留空时会继续使用当前稀有度默认图。
1. 某层如果想彻底关闭，可以写成 `far:none`、`mid:none`、`char:none`、`front:none`。
1. 旧写法依然兼容：`任务文本 | 背景图 | 角色图`

## Easy [100]
- 采集10个蓝莓 | bg:img/bg_hard.jpg | far: | mid: | char:img/char_1.webp | front:
- 收集10个普通木材 | img/bg_hard.jpg | img/char_4.webp
- 收集10个普通石头 | bg:img/bg_hard.jpg | mid: | char:img/char_5.webp | front:none
- 和宠物互动3次 | bg:img/bg_hard.jpg | far: | char:img/char_5.webp
- 喂3次宠物 | bg:img/bg_hard.jpg | char:img/char_5.webp | front:

## Normal [25]
- 给小镇每个成员点赞 | bg:img/bg_hard.jpg | far: | mid: | char:img/char_2.webp | front:
- 钓到3条罕见鱼块 | bg:img/bg_hard.jpg | mid: | char:img/char_6.webp
- 制作5个咖啡 | bg:img/bg_hard.jpg | char:img/char_1.webp | front:
- 遛狗：带着小狗把小镇溜一圈 | bg:img/bg_hard.jpg | far: | char:img/char_1.webp | front:none

## Hard [25]
- 给小镇每个成员浇花 | bg:img/bg_hard.jpg | far: | mid: | char:img/char_3.webp | front:
- 收集30个稀有木材 | bg:img/bg_hard.jpg | mid: | char:img/char_2.webp | front:
- 收集8个珍惜木材 | bg:img/bg_hard.jpg | char:img/char_4.webp | front:
- 做10个咖啡 | bg:img/bg_hard.jpg | far: | char:img/char_4.webp
- 采集十个黑松露（羊屎蛋） | bg:img/bg_hard.jpg | far: | mid: | char:img/char_4.webp | front:none

## Epic [25]
- 做十个黄金大闸蟹 | bg:img/bg_hard.jpg | far: | mid: | char:img/char_5.webp | front:
- 砍100棵树 | bg:img/bg_hard.jpg | mid: | char:img/char_6.webp | front:
- 钓30只鱼 | bg:img/bg_hard.jpg | far: | char:img/char_1.webp | front:
