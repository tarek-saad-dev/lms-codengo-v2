# LottiePlayer Component - Usage Guide

**Component:** `components/lottie-player.tsx`  
**Library:** [@lottiefiles/dotlottie-wc](https://www.npmjs.com/package/@lottiefiles/dotlottie-wc)

---

## 🎯 Overview

The `LottiePlayer` component is a reusable React wrapper for the `@lottiefiles/dotlottie-wc` web component. It automatically loads the library script and provides a clean API for displaying Lottie animations throughout your Next.js application.

---

## ✅ Features

- ✅ **Automatic script loading** — No manual script tags needed
- ✅ **Reusable** — Import and use anywhere in your app
- ✅ **TypeScript support** — Full type safety
- ✅ **Responsive** — Supports percentage-based sizing
- ✅ **Configurable** — Control autoplay, loop, speed, and more
- ✅ **Client-side only** — Uses "use client" directive
- ✅ **Cleanup** — Properly removes elements on unmount

---

## 📦 Installation

No installation needed! The component automatically loads the library from CDN:
```
https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.11/dist/dotlottie-wc.js
```

---

## 🚀 Basic Usage

### Import the component:
```tsx
import { LottiePlayer } from "@/components/lottie-player";
```

### Use in your component:
```tsx
<LottiePlayer
  src="https://lottie.host/your-animation-id/file.lottie"
  width={300}
  height={300}
  autoplay
  loop
/>
```

---

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **required** | URL to the .lottie animation file |
| `width` | `number \| string` | `300` | Width in pixels or CSS value (e.g., "100%") |
| `height` | `number \| string` | `300` | Height in pixels or CSS value (e.g., "100%") |
| `autoplay` | `boolean` | `true` | Start playing automatically |
| `loop` | `boolean` | `true` | Loop the animation |
| `speed` | `number` | `1` | Playback speed (1 = normal, 2 = 2x, etc.) |
| `className` | `string` | `""` | Additional CSS classes for the container |

---

## 💡 Examples

### Example 1: Fixed Size Animation
```tsx
<LottiePlayer
  src="https://lottie.host/922e09c2-2a0e-4520-910e-78e682bd6c54/hZ1XQMjZxE.lottie"
  width={400}
  height={400}
  autoplay
  loop
/>
```

### Example 2: Responsive Animation (100% of container)
```tsx
<div className="w-[240px] h-[240px] lg:w-[480px] lg:h-[480px]">
  <LottiePlayer
    src="https://lottie.host/your-animation/file.lottie"
    width="100%"
    height="100%"
    autoplay
    loop
  />
</div>
```

### Example 3: Slow Motion Animation
```tsx
<LottiePlayer
  src="https://lottie.host/your-animation/file.lottie"
  width={300}
  height={300}
  speed={0.5}  // Half speed
  autoplay
  loop
/>
```

### Example 4: Manual Play (No Autoplay)
```tsx
<LottiePlayer
  src="https://lottie.host/your-animation/file.lottie"
  width={300}
  height={300}
  autoplay={false}
  loop={false}
/>
```

### Example 5: With Custom Styling
```tsx
<LottiePlayer
  src="https://lottie.host/your-animation/file.lottie"
  width={300}
  height={300}
  autoplay
  loop
  className="rounded-lg shadow-xl border-2 border-gray-200"
/>
```

---

## 🎨 Responsive Design

### Mobile & Desktop Sizes

Use Tailwind CSS classes on the container for responsive sizing:

```tsx
<div className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[500px] lg:h-[500px]">
  <LottiePlayer
    src="https://lottie.host/your-animation/file.lottie"
    width="100%"
    height="100%"
    autoplay
    loop
  />
</div>
```

**Result:**
- Mobile: 200x200
- Tablet: 300x300
- Desktop: 500x500

---

## 🔧 Advanced Usage

### Centering the Animation

```tsx
<div className="flex items-center justify-center h-screen">
  <LottiePlayer
    src="https://lottie.host/your-animation/file.lottie"
    width={400}
    height={400}
    autoplay
    loop
  />
</div>
```

### Loading State

```tsx
import { Suspense } from "react";
import { LottiePlayer } from "@/components/lottie-player";

export default function MyComponent() {
  return (
    <Suspense fallback={<div>Loading animation...</div>}>
      <LottiePlayer
        src="https://lottie.host/your-animation/file.lottie"
        width={300}
        height={300}
        autoplay
        loop
      />
    </Suspense>
  );
}
```

### Multiple Animations

```tsx
<div className="grid grid-cols-3 gap-4">
  <LottiePlayer
    src="https://lottie.host/animation-1/file.lottie"
    width={200}
    height={200}
    autoplay
    loop
  />
  <LottiePlayer
    src="https://lottie.host/animation-2/file.lottie"
    width={200}
    height={200}
    autoplay
    loop
  />
  <LottiePlayer
    src="https://lottie.host/animation-3/file.lottie"
    width={200}
    height={200}
    autoplay
    loop
  />
</div>
```

---

## 🌐 Where to Get Lottie Animations

### 1. **LottieFiles** (Recommended)
- Website: https://lottiefiles.com
- Free and premium animations
- Direct hosting with CDN URLs
- Easy integration

### 2. **Create Your Own**
- Adobe After Effects + Bodymovin plugin
- Export as .lottie or .json format
- Upload to LottieFiles for hosting

### 3. **Other Sources**
- https://lottielab.com
- https://www.lottielab.io
- Design tools like Figma with Lottie plugins

---

## 📱 Real-World Use Cases

### 1. **Hero Section Animation** (Marketing Page)
```tsx
// app/(marketing)/page.tsx
<div className="w-[240px] h-[240px] lg:w-[480px] lg:h-[480px]">
  <LottiePlayer
    src="https://lottie.host/922e09c2-2a0e-4520-910e-78e682bd6c54/hZ1XQMjZxE.lottie"
    width="100%"
    height="100%"
    autoplay
    loop
  />
</div>
```

### 2. **Loading Spinner**
```tsx
// components/loading-spinner.tsx
<LottiePlayer
  src="https://lottie.host/loading-spinner/file.lottie"
  width={100}
  height={100}
  autoplay
  loop
/>
```

### 3. **Success Animation**
```tsx
// components/success-modal.tsx
<LottiePlayer
  src="https://lottie.host/success-checkmark/file.lottie"
  width={150}
  height={150}
  autoplay
  loop={false}
/>
```

### 4. **Empty State Illustration**
```tsx
// components/empty-state.tsx
<div className="flex flex-col items-center justify-center py-12">
  <LottiePlayer
    src="https://lottie.host/empty-box/file.lottie"
    width={300}
    height={300}
    autoplay
    loop
  />
  <p className="mt-4 text-gray-600">No items found</p>
</div>
```

### 5. **Course Completion Celebration**
```tsx
// app/lesson/course-end-screen.tsx
<LottiePlayer
  src="https://lottie.host/trophy-celebration/file.lottie"
  width={200}
  height={200}
  autoplay
  loop={false}
  speed={1.5}
/>
```

---

## ⚡ Performance Tips

### 1. **Use .lottie format** (not .json)
- Smaller file size
- Faster loading
- Better performance

### 2. **Optimize animation complexity**
- Reduce number of layers
- Simplify paths
- Lower frame rate if possible

### 3. **Lazy load animations**
```tsx
import dynamic from "next/dynamic";

const LottiePlayer = dynamic(() => 
  import("@/components/lottie-player").then(mod => mod.LottiePlayer),
  { ssr: false }
);
```

### 4. **Preload critical animations**
```tsx
// In your layout or page
<link
  rel="preload"
  href="https://lottie.host/your-animation/file.lottie"
  as="fetch"
  crossOrigin="anonymous"
/>
```

---

## 🐛 Troubleshooting

### Animation not showing?
1. Check that the `src` URL is correct and accessible
2. Ensure the component is used in a client component ("use client")
3. Check browser console for errors

### Animation too large/small?
- Adjust `width` and `height` props
- Use responsive container with percentage-based sizing

### Animation not looping?
- Set `loop={true}` prop
- Check that the animation file supports looping

### Script loading errors?
- Check internet connection
- Verify CDN is accessible
- Try clearing browser cache

---

## 🔄 Migration from GIF/Image

### Before (GIF):
```tsx
<Image src="/animation.gif" alt="animation" width={300} height={300} />
```

### After (Lottie):
```tsx
<LottiePlayer
  src="https://lottie.host/your-animation/file.lottie"
  width={300}
  height={300}
  autoplay
  loop
/>
```

**Benefits:**
- ✅ Smaller file size (50-90% reduction)
- ✅ Scalable (no quality loss)
- ✅ Better performance
- ✅ More control (speed, play/pause, etc.)

---

## 📊 File Size Comparison

| Format | Typical Size | Quality | Scalable |
|--------|--------------|---------|----------|
| GIF | 500KB - 5MB | Low | ❌ No |
| MP4 | 200KB - 2MB | Medium | ❌ No |
| Lottie (.lottie) | 10KB - 200KB | High | ✅ Yes |

---

## 🎉 Summary

The `LottiePlayer` component provides a simple, reusable way to add high-quality animations to your Next.js app:

1. **Import:** `import { LottiePlayer } from "@/components/lottie-player"`
2. **Use:** `<LottiePlayer src="..." width={300} height={300} />`
3. **Customize:** Adjust props for your needs
4. **Enjoy:** Beautiful, performant animations! 🚀

---

**Questions or issues?** Check the [dotlottie-wc documentation](https://github.com/LottieFiles/dotlottie-wc) or create an issue in your project repository.
