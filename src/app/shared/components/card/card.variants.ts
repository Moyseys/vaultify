import { cva, VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'block rounded-lg border bg-card text-card-foreground shadow-sm w-full p-6',
  {
    variants: {},
  },
);
export type CardVariants = VariantProps<typeof cardVariants>;

export const cardHeaderVariants = cva('flex flex-col space-y-1.5 pb-0 gap-1.5', {
  variants: {},
});
export type CardHeaderVariants = VariantProps<typeof cardHeaderVariants>;

export const cardBodyVariants = cva('block mt-6', {
  variants: {},
});
export type CardBodyVariants = VariantProps<typeof cardBodyVariants>;
