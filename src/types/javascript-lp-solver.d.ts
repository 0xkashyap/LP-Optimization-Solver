declare module 'javascript-lp-solver' {
  export interface Model {
    optimize: string;
    opType: 'min' | 'max';
    constraints: Record<string, { min?: number; max?: number; equal?: number }>;
    variables: Record<string, Record<string, number>>;
    ints?: Record<string, number>;
  }

  export interface Solution {
    feasible: boolean;
    result: number;
    bounded?: boolean;
    [variableName: string]: any;
  }

  export function Solve(model: Model): Solution;
}
