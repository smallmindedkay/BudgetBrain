export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Income',
  'Savings',
  'Other'
];

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string; // Changed from enum to string to support custom categories
  date: string; // ISO string
  type: TransactionType;
  isRecurring?: boolean;
  recurringRuleId?: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringRule {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  frequency: Frequency;
  nextDueDate: string; // ISO Date string
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export interface ReceiptData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
}