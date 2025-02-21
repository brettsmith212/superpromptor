/**
 * @file Central export file for all TypeScript types in SuperPromptor
 * @description 
 * This file serves as the single point of export for all type definitions in the project,
 * allowing imports via `@/types` as per project rules. It aggregates types from various
 * type definition files for convenience and consistency.
 * 
 * Key features:
 * - Exports all types from file-types.ts
 * 
 * @dependencies
 * - types/file-types.ts: Source of file and state type definitions
 * 
 * @notes
 * - Add additional exports here as new type files are created
 * - Ensures type safety and consistency across the application
 */

/// <reference path="./window.d.ts" />

export * from './file-types';