import { motion } from 'motion/react'
import { Link } from 'react-router'

/** A react-router Link that accepts motion props (whileHover, variants, etc). */
export const MotionLink = motion.create(Link)
