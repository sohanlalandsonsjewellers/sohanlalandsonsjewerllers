export function generateSKU(name: string, category: string): string {
  const prefix = category.substring(0, 3).toUpperCase(); // GOLD → GOL
  const random = Math.floor(10000 + Math.random() * 90000); // 5 digit number
  return `${prefix}-${random}`;
}
