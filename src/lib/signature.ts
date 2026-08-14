// Managing Director's signature image, hosted on Cloudinary rather than
// bundled as a local asset (see PDF generators in src/lib/*Pdf.tsx). Read
// from an env var instead of hardcoded so the URL isn't committed to the
// public repo — set VITE_SIGNATURE_IMAGE_URL locally and in Vercel.
//
// Kept in its own module, separate from siteInfo.ts: vite.config.ts imports
// api/*Handler.ts, which import siteInfo.ts for SITE_NAME/siteContact — if
// this lived there too, `vite build` would evaluate import.meta.env while
// loading the config file itself (outside the client build), where it's
// undefined, and crash.
export const signatureImageUrl = import.meta.env.VITE_SIGNATURE_IMAGE_URL as string
