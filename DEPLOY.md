# Bellaria 网站部署指南

本文档说明如何将 `bellaria-site/` 这个静态网站部署到 Vercel，并优化中国访问速度。

目标：**部署后中国 & 欧洲用户都能打开，首屏 < 3 秒**。

---

## 一、Vercel 部署（5 分钟完成）

### 方法 A：通过 Vercel CLI（最快）

```bash
# 1. 进入项目目录
cd "bellaria-site"

# 2. 安装 Vercel CLI（只需一次）
npm i -g vercel

# 3. 登录 Vercel（会打开浏览器）
vercel login

# 4. 预发布部署（每次改动）
vercel

# 5. 生产部署（正式上线）
vercel --prod
```

CLI 第一次会问你几个问题，按如下回答：

| 问题 | 回答 |
|------|------|
| Set up and deploy | **Y** |
| Which scope | 选择你的个人账户 |
| Link to existing project | **N**（第一次） |
| Project name | `bellaria` |
| In which directory is your code | `./` |
| Want to override the settings | **N** |

部署完成会得到一个 `*.vercel.app` 的临时域名。

### 方法 B：通过 GitHub + Vercel 网页集成（推荐团队协作）

1. 把 `bellaria-site/` 推到 GitHub 私有仓库
   ```bash
   cd "bellaria-site"
   git init
   git add .
   git commit -m "Initial Bellaria site"
   git remote add origin git@github.com:<your-org>/bellaria-site.git
   git push -u origin main
   ```
2. 登录 https://vercel.com/new
3. Import Git Repository → 选中 `bellaria-site`
4. Framework Preset 选 **Other**（纯静态站点，无需构建）
5. Build Command：留空
6. Output Directory：留空（根目录）
7. Deploy

之后每次 `git push` 到 `main` 分支都会自动发布。

---

## 二、中国访问加速

Vercel 默认的 `*.vercel.app` 域名在中国**不稳定且常被阻断**。解决方案由轻到重：

### 方案 1：绑定自己的域名（必做）

1. 在 GoDaddy、Namecheap、阿里云万网任一注册 `bellaria.com` 或 `bellaria.cn`
2. Vercel → Project → Settings → Domains → Add
3. 按 Vercel 提示修改 DNS：
   - 根域 `bellaria.com` → `A` 记录 `76.76.21.21`
   - `www` → `CNAME` `cname.vercel-dns.com`
4. 等待 TLS 证书签发（通常 2 分钟）

自定义域名在中国的访问速度比 `*.vercel.app` 好很多，但仍可能被某些运营商限流。

### 方案 2：Cloudflare CDN 代理（强烈推荐）

1. 在 Cloudflare 注册账号，把域名 NS 改到 Cloudflare
2. 在 Cloudflare DNS 把 `bellaria.com` 的 `A/CNAME` 指向 Vercel，并开启橙色云 (Proxied)
3. Cloudflare → SSL/TLS → Full (strict)
4. Cloudflare → Speed → 开启 Brotli、Early Hints、Auto Minify

Cloudflare 的中国线路仍有不确定性，但在多数地区比直接访问 Vercel 快 2-5 倍。

### 方案 3：阿里云/腾讯云 CDN + ICP 备案（中国用户体验最佳）

> 本方案只有在中国业务规模起来之后再做。前期不必。

1. 先在阿里云或腾讯云注册 **中国域名** `bellaria.cn`
2. 提交 ICP 备案（需要公司主体，约 15-20 个工作日）
3. 备案通过后开通阿里云 CDN
4. 源站可以继续用 Vercel（走跨境链路）或改为阿里云 OSS 静态托管
5. 建议做双域名策略：
   - `bellaria.com` → Vercel（欧洲用户）
   - `bellaria.cn`  → 阿里云 CDN（中国用户）
   - 在首页用 GeoIP 判断后 302

### 方案 4：最简 —— 只用自定义域名 + Cloudflare

如果预算和精力有限，**方案 1 + 方案 2** 就够了。欧洲访问 < 1 秒，中国访问 2-5 秒，体验已经可以用于正式对外。

---

## 三、表单后端接入

`assets/app.js` 中有一个常量：

```js
const FORMSPREE_ENDPOINT = ''; // e.g. 'https://formspree.io/f/abcd1234'
```

### 推荐：Formspree (3 分钟)

1. 注册 https://formspree.io
2. 新建表单，选择 "Accept submissions from bellaria.com"
3. 复制 endpoint，例如 `https://formspree.io/f/xkndpaaz`
4. 填入 `assets/app.js` 的 `FORMSPREE_ENDPOINT`
5. 提交 `vercel --prod`

免费版本每月 50 条，$10/月可解锁 1000 条 + 垃圾邮件过滤 + 欧洲数据中心。

### 替代方案

| 服务 | 免费额度 | 推荐度 | 备注 |
|------|---------|--------|------|
| Formspree | 50/月 | ★★★★★ | 最简单 |
| Basin     | 100/月 | ★★★★ | GDPR 友好 |
| Getform   | 50/月 | ★★★★ | |
| Resend + Vercel Serverless | 3000 邮件/月 | ★★★ | 需写代码 |
| 自建（飞书/企微 webhook）| 无限 | ★★ | 适合内部 |

---

## 四、内容修改手册

### 修改文案（最常见）

所有中英文案都在 `index.html` 里，每段都是一对：

```html
<span data-en>English text</span>
<span data-zh>中文文案</span>
```

直接编辑这两行内容即可，无需改 CSS/JS。

### 修改图片

所有主图都使用 Unsplash CDN，例如：

```html
style="background-image: url('https://images.unsplash.com/photo-.../?...')"
```

如果要换成自己的图片：
1. 将 JPG/PNG 放到 `assets/images/` 目录
2. 把 URL 改为 `/assets/images/your-photo.jpg`
3. 图片建议 **< 400KB**、**1600px 宽**、**mozjpeg 80% 质量**

### 修改案例 / 品牌 Logo Marquee

- 案例：`index.html` 的 `<!-- CASES -->` 区域，复制一个 `<article class="case">` 块即可
- 品牌列表：`<!-- MARQUEE -->` 区域，前后各有一份（用于无缝滚动），两份都要改

### 修改颜色 / 品牌视觉

所有颜色、字号、间距都在 `assets/styles.css` 顶部的 `:root` 里：

```css
:root {
  --ivory:     #FAF7F2;  /* 主背景色 */
  --charcoal:  #1C1917;  /* 主文字色 */
  --oxblood:   #7A1515;  /* 重点红 */
  --gold:      #B8945F;  /* 点缀金 */
  ...
}
```

改这里一次即可全站生效。

---

## 五、性能优化清单

部署后用 https://pagespeed.web.dev 检查，目标分数：

- **Performance**   ≥ 90
- **Accessibility** ≥ 95
- **Best Practices** ≥ 95
- **SEO**           ≥ 95

如果达不到，检查：

1. Unsplash 图片是否加了 `&q=75&w=1600` 压缩参数 ✓ 已加
2. 字体是否 `display=swap` ✓ 已加
3. 关键图片是否 `preload` ✓ 已加
4. 是否启用 `vercel.json` 里的 `immutable` 缓存 ✓ 已加
5. HTML 页面是否未压缩 — Vercel 自动 gzip/brotli

---

## 六、上线前最终检查

- [ ] `index.html` 里 `https://bellaria.com/` 所有引用改为实际域名
- [ ] `sitemap.xml` 里的 URL 改为实际域名
- [ ] `robots.txt` 里的 Sitemap URL 改为实际域名
- [ ] `assets/app.js` 的 `FORMSPREE_ENDPOINT` 已填
- [ ] 在手机（iOS Safari + 安卓 Chrome）、PC（Chrome/Safari/Edge）都打开检查
- [ ] 中英文切换正常，刷新后记住语言
- [ ] 表单提交成功收到测试邮件
- [ ] 所有 `#anchor` 跳转平滑
- [ ] Open Graph 预览：https://www.opengraph.xyz/url/ + 你的 URL
- [ ] LinkedIn 预览：https://www.linkedin.com/post-inspector/

---

## 七、常见问题

**Q: 部署后白屏？**
A: 打开浏览器 DevTools → Console 看报错。多半是路径问题——确保 `index.html` 里引用的是 `/assets/styles.css` 而不是 `./assets/styles.css`。

**Q: 中国访问很慢？**
A: 先确认你用的是自定义域名而不是 `*.vercel.app`。其次打开 Cloudflare 代理。

**Q: 表单提交没收到邮件？**
A: 先检查 Formspree 控制台是否有记录。第一次提交 Formspree 会发验证邮件到你注册邮箱，验证后才真正转发。

**Q: 字体加载慢？**
A: Google Fonts 在中国不稳定。可改用国内镜像：把 `fonts.googleapis.com` 替换为 `fonts.googleapis.cn` 或 `fonts.loli.net`。

---

## 八、下一步扩展建议

1. **博客 / 洞察栏目**：把 `#insights` 区块改造成真实博客，可用 Vercel + Notion + `notion-to-md` 做 CMS，或加一个 `blog/` 文件夹存 Markdown。
2. **多语言版本独立 URL**：目前是单页 + JS 切换，SEO 不友好。量大后可拆成 `/en/`、`/zh/` 两套页面，hreflang 已在 sitemap 里铺好。
3. **埋点分析**：Plausible / Umami（隐私友好）或 Google Analytics 4。注意中国用户是否能回传数据。
4. **A/B 测试**：Vercel Edge Config + 简单 JS 就能跑首屏 CTA 文案的 AB。
5. **接入企业微信 / 飞书**：表单提交直接进团队群，响应 < 1 小时。

---

有问题直接联系 CTO/运营总监团队。
© 2026 上海拾喻信息科技有限公司
