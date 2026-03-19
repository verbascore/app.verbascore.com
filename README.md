# VerbaScore Recorder

VerbaScore Recorder is a React Native mobile app for sales sellers that captures live call audio into two channels, authenticates users with Clerk, and syncs recordings directly into the existing Convex team workspace.

The app is designed as a seller-only mobile companion to the existing VerbaScore web product. A seller signs in, prepares an upcoming call by entering a title and description, records both sides of the conversation, and uploads the resulting audio into the existing backend so the rest of the team can review, analyze, and coach from the shared workspace.

## Product Goal

Create a mobile app that lets sellers record a phone call in a way that produces two separate audio channels:

- seller audio from the device microphone
- client audio from the phone/call audio source

Those recordings should be published into the existing VerbaScore Convex backend as normal team-owned calls, preserving the current multi-tenant team model and existing analysis pipeline.

## Core Requirements

- React Native application
- Clerk authentication
- Convex backend integration
- seller-only access
- start recording flow with required call metadata
- separate seller/client audio outputs
- upload recordings to the existing VerbaScore backend

## Authentication And Access Control

The app must use Clerk for authentication.

After sign-in, the app should resolve the user’s current team membership through the existing Convex backend. Only users whose active membership role is `seller` should be allowed to use the recorder. If the authenticated user is an `owner`, the recording workflow should be blocked and the app should show a clear message that the mobile recorder is only available to seller accounts.

## Recording Workflow

The primary user flow should be:

1. Seller signs in with Clerk.
2. App loads the active team and confirms the user is a seller.
3. Seller enters a call title.
4. Seller enters a call description.
5. The `Start recording` button becomes enabled only when both fields are filled in.
6. Seller starts recording.
7. App records:
   - microphone input as the seller channel
   - phone/call audio as the client channel
8. Seller stops recording.
9. App uploads both files to Convex storage.
10. App creates a new call record in Convex using the existing backend model.

## Recording States

The app should explicitly support these states:

- idle
- ready
- recording
- stopping
- uploading
- success
- failed

The user should always understand what the app is doing, especially during stopping and upload.

## Call Creation Rules

Before recording starts:

- `title` is required
- `description` is required
- the `Start recording` button must remain disabled until both are present

When upload completes successfully, the app should create a call that matches the current VerbaScore backend expectations:

- team-owned
- created by the authenticated seller
- visible to the seller’s full team in the existing web app
- compatible with the current Convex analysis pipeline

## Backend Integration

The app should connect to the existing Convex backend rather than introducing a separate backend.

Expected integration responsibilities:

- authenticate the user
- resolve current team membership
- validate seller role
- upload seller and client audio files to Convex storage
- create a `call` record with title, description, team ownership, and creator user reference

## UX Requirements

The interface should be mobile-first and optimized for real call capture.

It should include:

- large, obvious recording controls
- very clear recording status
- clear validation on title and description
- upload progress and failure handling
- retry behavior if upload fails
- safe handling for interrupted or incomplete recordings

## Technical Notes

Capturing both phone audio and microphone audio is platform-sensitive and may require different native implementations on iOS and Android.

This should be treated as a native-capability-heavy React Native project rather than a simple voice memo app. In particular:

- microphone capture is straightforward
- phone/call audio capture may require native modules, device-specific support, permissions work, and platform-specific limitations
- implementation feasibility may differ significantly between Android and iOS

Because of that, the project should be planned as a serious mobile recording product with native audio considerations from the beginning.

## Suggested MVP

An initial MVP should focus on:

- Clerk sign-in
- Convex connectivity
- seller-role enforcement
- metadata form with required title and description
- record lifecycle UI
- dual audio capture where platform support allows it
- upload to existing backend
- successful creation of shared call records

## One-Line Summary

VerbaScore Recorder is a React Native seller-only mobile app that records sales calls into seller and client audio channels, authenticates users with Clerk, and syncs recordings into the existing Convex-powered VerbaScore workspace.
