/**
 * Responsive Sizes Constants
 * Provides consistent percentage-based sizing across the app
 * Using react-native-responsive-screen for cross-device compatibility
 */

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

// ============================================================
// SPACING
// ============================================================

export const SPACING = {
  // Tiny spacing (2-4px equivalent)
  TINY: hp('0.3%'),
  TINY_HORIZONTAL: wp('0.5%'),
  
  // Small spacing (6-10px equivalent)
  SMALL: hp('0.8%'),
  SMALL_HORIZONTAL: wp('1.5%'),
  
  // Medium spacing (12-16px equivalent)
  MEDIUM: hp('1.5%'),
  MEDIUM_HORIZONTAL: wp('3%'),
  
  // Large spacing (20-24px equivalent)
  LARGE: hp('2.5%'),
  LARGE_HORIZONTAL: wp('5%'),
  
  // Extra large spacing (32-40px equivalent)
  XLARGE: hp('4%'),
  XLARGE_HORIZONTAL: wp('8%'),
  
  // Section spacing
  SECTION: hp('3%'),
};

// ============================================================
// FONT SIZES
// ============================================================

export const FONT_SIZES = {
  // Small text (8-10px equivalent)
  TINY: Math.max(hp('1%'), 10),      // Min 10px for readability
  
  // Caption text (11-12px equivalent)
  CAPTION: Math.max(hp('1.3%'), 11),  // Min 11px
  
  // Body text (13-14px equivalent)
  SMALL: Math.max(hp('1.5%'), 12),    // Min 12px
  BODY: Math.max(hp('1.8%'), 13),     // Min 13px
  
  // Heading text (16-18px equivalent)
  MEDIUM: Math.max(hp('2%'), 14),     // Min 14px
  HEADING: Math.max(hp('2.5%'), 16),  // Min 16px
  
  // Large heading (20-24px equivalent)
  LARGE: Math.max(hp('3%'), 18),      // Min 18px
  XLARGE: Math.max(hp('3.5%'), 20),   // Min 20px
  
  // Title text (28-32px equivalent)
  TITLE: Math.max(hp('4%'), 24),      // Min 24px
  DISPLAY: Math.max(hp('5%'), 28),    // Min 28px
};

// ============================================================
// COMPONENT SIZES
// ============================================================

export const BUTTON_SIZES = {
  // Button heights
  SMALL: hp('5%'),
  MEDIUM: hp('6%'),
  LARGE: hp('7%'),
  
  // Button paddings
  PADDING_HORIZONTAL: wp('4%'),
  PADDING_VERTICAL: hp('1.5%'),
};

export const ICON_SIZES = {
  TINY: hp('1.5%'),
  SMALL: hp('2%'),
  MEDIUM: hp('2.5%'),
  LARGE: hp('3.5%'),
  XLARGE: hp('5%'),
};

export const INPUT_SIZES = {
  HEIGHT: hp('6%'),
  PADDING: wp('3%'),
  BORDER_RADIUS: hp('1%'),
};

export const CARD_SIZES = {
  PADDING: wp('4%'),
  BORDER_RADIUS: hp('1.2%'),
  SHADOW_RADIUS: hp('0.5%'),
};

// ============================================================
// WIDTHS
// ============================================================

export const WIDTHS = {
  // Standard widths
  FULL: wp('100%'),
  CONTENT: wp('90%'),          // Main content area
  CONTENT_MAX: wp('95%'),      // Maximum content width
  HALF: wp('45%'),
  THIRD: wp('30%'),
  QUARTER: wp('22%'),
  
  // Modal widths
  MODAL_SMALL: wp('75%'),
  MODAL_MEDIUM: wp('85%'),
  MODAL_LARGE: wp('95%'),
  
  // Card widths
  CARD_SMALL: wp('40%'),
  CARD_MEDIUM: wp('45%'),
  CARD_LARGE: wp('90%'),
};

// ============================================================
// HEIGHTS
// ============================================================

export const HEIGHTS = {
  // Component heights
  HEADER: hp('8%'),
  TAB_BAR: hp('8%'),
  BOTTOM_SHEET: hp('60%'),
  
  // Modal heights
  MODAL_SMALL: hp('30%'),
  MODAL_MEDIUM: hp('50%'),
  MODAL_LARGE: hp('80%'),
  
  // Row heights
  LIST_ITEM: hp('8%'),
  LIST_ITEM_SMALL: hp('6%'),
  LIST_ITEM_LARGE: hp('10%'),
};

// ============================================================
// TOUCH TARGET SIZES
// ============================================================

export const TOUCH_TARGETS = {
  // Minimum touch targets for accessibility (44x44 points)
  MIN_WIDTH: Math.max(wp('10%'), 44),
  MIN_HEIGHT: Math.max(hp('5.5%'), 44),
  
  // Standard touch targets
  SMALL: hp('5%'),
  MEDIUM: hp('6%'),
  LARGE: hp('8%'),
};

// ============================================================
// BORDER RADIUS
// ============================================================

export const BORDER_RADIUS = {
  SMALL: hp('0.5%'),
  MEDIUM: hp('1%'),
  LARGE: hp('1.5%'),
  XLARGE: hp('2%'),
  ROUND: hp('50%'),
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get responsive width
 * @param {number} percentage - Percentage of screen width (1-100)
 */
export const rw = (percentage) => wp(`${percentage}%`);

/**
 * Get responsive height
 * @param {number} percentage - Percentage of screen height (1-100)
 */
export const rh = (percentage) => hp(`${percentage}%`);

/**
 * Get responsive font size with minimum
 * @param {number} percentage - Percentage of screen height
 * @param {number} min - Minimum font size in pixels
 */
export const rf = (percentage, min = 12) => Math.max(hp(`${percentage}%`), min);

// ============================================================
// RESPONSIVE SIZES OBJECT (backward compatibility)
// ============================================================

export const RESPONSIVE_SIZES = {
  // Spacing
  TINY: SPACING.TINY,
  SMALL: SPACING.SMALL,
  MEDIUM: SPACING.MEDIUM,
  LARGE: SPACING.LARGE,
  XLARGE: SPACING.XLARGE,
  
  // Font sizes
  FONT_TINY: FONT_SIZES.TINY,
  FONT_SMALL: FONT_SIZES.SMALL,
  FONT_BODY: FONT_SIZES.BODY,
  FONT_HEADING: FONT_SIZES.HEADING,
  FONT_LARGE: FONT_SIZES.LARGE,
  
  // Component sizes
  BUTTON_HEIGHT: BUTTON_SIZES.MEDIUM,
  ICON_SMALL: ICON_SIZES.SMALL,
  ICON_MEDIUM: ICON_SIZES.MEDIUM,
  ICON_LARGE: ICON_SIZES.LARGE,
  
  // Widths
  FULL_WIDTH: WIDTHS.FULL,
  CONTENT_WIDTH: WIDTHS.CONTENT,
  HALF_WIDTH: WIDTHS.HALF,
};

export default {
  SPACING,
  FONT_SIZES,
  BUTTON_SIZES,
  ICON_SIZES,
  INPUT_SIZES,
  CARD_SIZES,
  WIDTHS,
  HEIGHTS,
  TOUCH_TARGETS,
  BORDER_RADIUS,
  RESPONSIVE_SIZES,
  rw,
  rh,
  rf,
  wp,
  hp,
};

