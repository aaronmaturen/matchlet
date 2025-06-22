/**
 * Returns the appropriate Tailwind grid columns class based on the number of columns
 * with responsive breakpoints
 */
export const getGridColsClass = (cols: number): string => {
  switch (cols) {
    case 3:
      return "grid-cols-2 sm:grid-cols-3";
    case 4:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    case 5:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    case 6:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    case 8:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8";
    case 9:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9";
    default:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  }
};
