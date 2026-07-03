# Blueprint: E-commerce Store Debugging

## Overview

This document outlines the plan to debug and fix critical issues in a Next.js-based e-commerce application. The application is currently facing problems with user authentication, data fetching from Firestore, and displaying static assets.

## Current State Analysis

Based on the user's report and the last deployment log, the following issues have been identified:

1.  **Login Failure:** Users cannot log into the admin dashboard.
2.  **Data Not Displaying:** Products and categories are not visible on the main site or in the admin panel.
3.  **Missing Logo:** The store's logo is not appearing.
4.  **Build Warnings:** The deployment log shows warnings about an unsupported Node.js engine (`v20.20.2` is used, while some packages require `>=22`).
5.  **Dynamic Rendering Errors:** The build log contains multiple "Dynamic server usage" errors related to the use of `cookies` during server-side rendering, which is a strong indicator of problems with session handling in the Next.js App Router.

## Remediation Plan

The following steps will be taken to resolve these issues. Each code modification will be presented to the user for approval before being saved.

1.  **✅ (Done) Update Node.js Environment:**
    *   **Action:** Modify `.idx/dev.nix` to upgrade the development environment from `pkgs.nodejs_20` to `pkgs.nodejs_22`.
    *   **Reason:** To resolve the `EBADENGINE` warnings and ensure compatibility with all project dependencies.

2.  **Investigate Authentication and Session Handling:**
    *   **Action:** Review the code in `app/lib/session.ts`, `app/context/AuthContext.tsx`, and `app/login/page.tsx`. I will check how the session cookie is being created and read.
    *   **Reason:** The "Dynamic server usage" errors point to incorrect handling of cookies. In the Next.js App Router, server-side components must use the `cookies()` function from `next/headers` to access cookies safely during rendering. Incorrect implementation is likely the root cause of the login failure.

3.  **Debug Data Fetching Logic:**
    *   **Action:** Examine the data fetching functions in `app/lib/data-server.ts` and their usage in pages like `app/products/page.tsx` and `app/admin/products/page.tsx`.
    *   **Reason:** The inability to fetch products and categories is likely a side effect of the authentication issue. If the user session cannot be verified, the backend queries to Firestore are probably failing or returning no data.

4.  **Fix a Broken Logo Image Path:**
    *   **Action:** Inspect `app/components/Header.tsx` to find how the logo is rendered. I will verify the image path and ensure the logo file exists in the `/public` directory.
    *   **Reason:** The logo is a static asset. If it's not displaying, the path in the `<img>` tag is likely incorrect or the file is missing.

5.  **Deploy and Verify:**
    *   **Action:** After implementing and approving the fixes, a new deployment will be initiated.
    *   **Reason:** To confirm that the fixes have resolved all the identified issues and the application is fully functional.
