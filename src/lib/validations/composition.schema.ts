import { z } from "zod";

/**
 * Zod validation schema for a single element input row.
 */
export const elementInputSchema = z.object({
  id: z.string().optional(),
  symbol: z
    .string()
    .trim()
    .min(1, "Chemical symbol cannot be empty.")
    .max(3, "Chemical symbol must be 1 to 3 characters.")
    .regex(/^[A-Z][a-z]?$/, "Invalid chemical symbol format (e.g. Al, Fe, Cu)."),
  percent: z
    .number()
    .finite("Percentage must be a finite number.")
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot exceed 100%."),
});

export type ElementInputDTO = z.infer<typeof elementInputSchema>;

/**
 * Base metal selection schema.
 */
export const baseMetalSelectionSchema = z.object({
  metalId: z
    .string()
    .trim()
    .min(1, "Base metal identifier is required.")
    .regex(/^[a-z]{1,4}$/, "Invalid base metal identifier format."),
});

export type BaseMetalSelectionDTO = z.infer<typeof baseMetalSelectionSchema>;

/**
 * Reference specification selection schema.
 */
export const specificationSelectionSchema = z.object({
  alloyId: z.string().trim().min(1, "Specification identifier is required."),
  customName: z.string().trim().max(60).optional(),
});

export type SpecificationSelectionDTO = z.infer<typeof specificationSelectionSchema>;

/**
 * Full alloy composition input schema with duplicate element prevention and 100% mass balance constraints.
 */
export const compositionFormSchema = z
  .object({
    baseMetalId: z.string().min(1, "A base metal must be selected."),
    balanceElementSymbol: z.string().min(1, "A balance element must be designated."),
    specificationId: z.string().min(1, "Specification selection is required."),
    elements: z
      .array(elementInputSchema)
      .refine(
        (items) => {
          const symbols = items.map((i) => i.symbol.toUpperCase());
          return new Set(symbols).size === symbols.length;
        },
        {
          message: "Duplicate alloying elements detected. Each element must be entered once.",
        }
      ),
  })
  .refine(
    (data) => {
      // Exclude balance element if accidentally included in solute array
      const solutes = data.elements.filter(
        (e) => e.symbol.toUpperCase() !== data.balanceElementSymbol.toUpperCase()
      );
      const sum = solutes.reduce((acc, curr) => acc + curr.percent, 0);
      return sum <= 100;
    },
    {
      message: "The entered alloying elements exceed 100%. Review the composition values.",
      path: ["elements"],
    }
  );

export type CompositionFormDTO = z.infer<typeof compositionFormSchema>;
