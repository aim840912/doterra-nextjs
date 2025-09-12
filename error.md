[21:37:25.694] Running build in Washington, D.C., USA (East) – iad1
[21:37:25.695] Build machine configuration: 2 cores, 8 GB
[21:37:25.735] Cloning github.com/aim840912/doterra-nextjs (Branch: main, Commit: a9463a9)
[21:37:27.774] Cloning completed: 2.039s
[21:37:27.926] Restored build cache from previous deployment (FhhjdzszjpPgFVDUtahBw8UvJ3uh)
[21:37:28.364] Running "vercel build"
[21:37:28.752] Vercel CLI 47.1.1
[21:37:29.083] Installing dependencies...
[21:37:30.311]
[21:37:30.312] up to date in 1s
[21:37:30.312]
[21:37:30.312] 182 packages are looking for funding
[21:37:30.312]   run `npm fund` for details
[21:37:30.340] Detected Next.js version: 15.5.3
[21:37:30.344] Running "npm run build"
[21:37:30.451]
[21:37:30.452] > doterra@0.1.0 build
[21:37:30.452] > next build
[21:37:30.452]
[21:37:31.514]    ▲ Next.js 15.5.3
[21:37:31.515]
[21:37:31.599]    Creating an optimized production build ...
[21:37:39.529]  ✓ Compiled successfully in 5.3s
[21:37:39.534]    Linting and checking validity of types ...
[21:37:45.060]
[21:37:45.061] Failed to compile.
[21:37:45.061]
[21:37:45.062] ./src/app/api/oils/route.ts
[21:37:45.062] 13:12  Warning: '_error' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.062]
[21:37:45.062] ./src/app/test-oils/page.tsx
[21:37:45.062] 42:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[21:37:45.062]
[21:37:45.062] ./src/components/ImageUploader.tsx
[21:37:45.062] 135:6  Warning: React Hook useCallback has a missing dependency: 'uploadedImages'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[21:37:45.063]
[21:37:45.063] ./src/components/OilList.tsx
[21:37:45.063] 77:18  Warning: 'setSortBy' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:37:45.063]
[21:37:45.063] ./src/data/products.ts
[21:37:45.063] 15:24  Warning: 'getBestsellerOilsNew' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.063] 16:17  Warning: 'getNewOilsNew' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.063] 17:21  Warning: 'getDoTerraOilsNew' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.063] 84:9  Warning: 'categoryProducts' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[21:37:45.064] 85:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[21:37:45.064]
[21:37:45.064] ./src/hooks/useFavorites.ts
[21:37:45.064] 13:3  Warning: 'getFavoritesCount' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.064]
[21:37:45.064] ./src/lib/favorites-storage.ts
[21:37:45.064] 24:12  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.064] 174:16  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[21:37:45.064]
[21:37:45.064] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[21:37:45.100] Error: Command "npm run build" exited with 1