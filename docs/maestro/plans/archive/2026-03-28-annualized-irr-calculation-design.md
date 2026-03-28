# Design Document: Annualized IRR (TIR) Calculation

**Date**: 2026-03-28
**Status**: Approved
**Design Depth**: Standard
**Task Complexity**: Medium

## 1. Problem Statement

Currently, the `expectedClosingDate` in the database is stored as a string, which is suitable for display but unsuitable for financial calculations. Users need a reliable way to calculate the **annualized Internal Rate of Return (IRR)** for merger arbitrage opportunities to evaluate their potential returns over time.

This design proposes updating the database schema to store `expectedClosingDate` as a `DateTime` and implementing a calculation method in the backend to provide a real-time, annualized IRR (TIR) whenever a closing date is available. This will ensure that all financial metrics are accurate, up-to-date, and consistently calculated across the platform.

## 2. Requirements

### Functional Requirements
- **Database Schema Update**: Change `expectedClosingDate` from `String?` to `DateTime?` in the Prisma schema. — *Provides a single source of truth for the closing date.*
- **Annualized IRR Calculation**: Implement a `calculateAnnualizedIRR` method in the `SpreadCalculatorService` using the formula: `IRR = ((1 + spread/100)^(365 / days_to_closing) - 1) * 100`. — *Ensures that all returns are comparable on an annualized basis.*
- **Real-Time Calculation**: The IRR should be calculated on-the-fly relative to the current date whenever merger data is requested or prices are updated. — *Maintains accurate metrics as prices change or the closing date approaches.*
- **Frontend Display**: Update the `MergerCard` and associated types to display the calculated IRR as a percentage (e.g., "TIR: 12.5%"). — *Gives the user immediate access to critical return metrics.*

### Non-Functional Requirements
- **Data Integrity**: The `expectedClosingDate` should be optional in the schema to handle mergers without a confirmed closing date.
- **Maintainability**: Financial logic must be centralized in the `SpreadCalculatorService` to avoid duplicating calculation code.
- **Performance**: IRR calculations should be efficient to avoid latency when enriching merger data in bulk.

### Constraints
- **Migration Strategy**: Use a "Fresh Start" migration, nullifying existing string values in `expectedClosingDate` to avoid parsing errors. — *Ensures a clean transition to the new Date format.*

## 3. Approach

We have selected **Approach 1: Pragmatic Migration & Calculation** because it provides a clean, unified path for integrating the new IRR feature into the existing architecture.

### Selected Approach: Pragmatic Migration & Calculation
- **Schema Update**: Update the `expectedClosingDate` field from `String?` to `DateTime?` in the Prisma schema.
- **Service Integration**: The new `calculateAnnualizedIRR` logic will be added to the `SpreadCalculatorService`.
- **Enrichment Logic**: The `enrichMerger` function in `mergerUtils.ts` will be updated to include the calculated IRR whenever an `expectedClosingDate` is present.
- **Frontend Display**: The `MergerCard` will be updated to show the IRR (TIR) metric alongside the spread.

### Alternatives Considered
- **Approach 2: Parallel Fields & Specialized Calculation Service**: This would have added a new `closingDate` DateTime field while keeping the old string field. This was rejected to ensure data integrity and avoid redundancy. — *Rejected to ensure data integrity.*

### Decision Matrix Summary

| Criterion | Weight | Approach 1: Pragmatic | Approach 2: Parallel |
|-----------|--------|-----------------------|----------------------|
| **Maintainability** | 40% | 5: Clean, unified field management. | 3: Managing two fields adds overhead. |
| **Simplicity** | 30% | 5: Direct update to existing services. | 3: Adds a new service and complexity. |
| **Data Integrity**| 30% | 5: Single source of truth for dates. | 2: Risk of field inconsistency. |
| **Weighted Total**| | **5.0** | **2.7** |

## 4. Architecture

### Backend Architecture
- **Data Flow**: The `SpreadCalculatorService` will now include a `calculateAnnualizedIRR` method. When `enrichMerger` is called in `mergerUtils.ts`, it will retrieve the current price and spread, and then call the new IRR calculation if an `expectedClosingDate` is present. — *Ensures the calculated IRR is consistent with the latest price and closing date.*
- **Key Interface (SpreadCalculatorService)**:
  ```typescript
  class SpreadCalculatorService {
    calculateAnnualizedIRR(spreadPercentage: number, closingDate: Date): number | null {
      // Logic for ( (1 + spread/100)^(365 / days_to_closing) - 1 ) * 100
    }
  }
  ```

### Frontend Architecture
- **Data Model**: The `Merger` type in `features/arbitrage/types.ts` will be updated to include an optional `irr` number field. — *Explicitly defines the IRR field for type safety across the frontend.*
- **UI Component**: The `MergerCard.tsx` component will be updated to display the calculated IRR as a formatted percentage (e.g., `TIR: 12.5%`) only when the `irr` property is available. — *Provides a clear and concise return metric to the user.*

## 5. Agent Team

- **architect**: Oversee the database migration and service integration.
- **coder**: Implement the schema change, `SpreadCalculatorService` update, and frontend UI changes.
- **tester**: Verify the accuracy of the IRR calculation and the correctness of the database migration.

## 6. Risk Assessment

| Risk | Mitigation |
|------|------------|
| **Migration Data Loss** | Use a "Fresh Start" migration, nullifying existing string values in `expectedClosingDate` to avoid parsing errors. This is an intentional choice for a clean start. |
| **Negative Days to Closing** | Validate the `expectedClosingDate` in the calculation method. If the date has already passed, return `null` or a specific value indicating a closed or expired deal. |
| **Infinite or Extremely High IRR** | Cap the calculated IRR value or return `null` if the remaining time is less than one day, to avoid misleading or mathematically unstable results. |
| **Inaccurate Spread Calculation** | Ensure that the IRR calculation uses the same spread percentage that is presented to the user, to maintain consistency across the UI. |

## 7. Success Criteria

- **Schema Success**: The `expectedClosingDate` is correctly updated to `DateTime?` in the Prisma schema and the database.
- **Calculation Accuracy**: The `calculateAnnualizedIRR` method produces correct values for various spreads and closing dates.
- **UI Display**: The IRR (TIR) is correctly displayed in the `MergerCard` when a closing date is available.
- **Real-Time Updates**: The IRR value updates correctly as prices change or as the current date approaches the closing date.
