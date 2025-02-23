"use client"

/**
 * @file Disappearing alert component for SuperPromptor
 * @description
 * This client-side component displays a temporary alert message that automatically
 * disappears after 3 seconds. It uses Framer Motion for fade-in and fade-out animations.
 * The alert is positioned fixed at the top-right corner of the screen, fulfilling the
 * design request for a disappearing "Template Removed" alert.
 *
 * Key features:
 * - Displays a message passed via props
 * - Automatically closes after 3 seconds using a timeout
 * - Uses Framer Motion for smooth entrance and exit animations
 * - Styled with Tailwind CSS for a blue background and white text
 *
 * @dependencies
 * - react: For useEffect to manage the timeout
 * - framer-motion: For animation effects (installed in Step 1)
 *
 * @notes
 * - Marked as "use client" per project rules for client-side interactivity
 * - Positioned fixed with z-50 to ensure it overlays other content
 * - Timeout is cleared on unmount to prevent memory leaks
 * - Animation uses opacity and y-position for a subtle fade and slide effect
 * - Assumes framer-motion is installed as per Step 1 of the implementation plan
 */

import { useEffect } from "react"
import { motion } from "framer-motion"

interface AlertProps {
  /**
   * The message to display in the alert.
   * Example: "Template Removed"
   */
  message: string

  /**
   * Callback function to close the alert, typically clearing the message in the parent component.
   * Called after the 3-second timeout.
   */
  onClose: () => void
}

export default function Alert({ message, onClose }: AlertProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded shadow-lg z-50"
    >
      {message}
    </motion.div>
  )
}