// Final Project - COP 5818
// Team 7
// Henry Gibson-Garcia – henry.gibson@ucf.edu
// Katherine Mendez Zambrano – ka523884@ucf.edu

// emotispendApi.js

// 1) Initialize Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bbxrxgmanwtovescnjaw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHJ4Z21hbnd0b3Zlc2NuamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzMxNjgsImV4cCI6MjA3OTMwOTE2OH0.WuS2TXrLSkuSo9bkQfpkD71G-N4ZTGulWuJ8IvsoUHI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2) Auth helpers

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error("Sign-up error:", error.message);
    throw error;
  }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error("Sign-in error:", error.message);
    throw error;
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign-out error:", error.message);
    throw error;
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Get user error:", error.message);
    throw error;
  }
  return data.user;
}

// 3) Expense helpers

export async function addExpense({
  amount,
  category,
  valence,
  emotion,
  intensity,
  spent_at,
  note,
}) {
  // Get the currently logged in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Get user before insert error:", userError.message);
    throw userError;
  }

  if (!user) {
    throw new Error("No authenticated user, cannot add expense");
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([
      {
        user_id: user.id, // important for RLS
        amount,
        category,
        valence,
        emotion,
        intensity,
        spent_at: spent_at ?? new Date().toISOString(),
        note: note ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Add expense error:", error.message);
    throw error;
  }
  return data;
}

export async function getExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("spent_at", { ascending: false });

  if (error) {
    console.error("Get expenses error:", error.message);
    throw error;
  }
  return data || [];
}

export async function getSpendingByCategory() {
  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount");

  if (error) {
    console.error("Get spending by category error:", error.message);
    throw error;
  }

  const totals = {};
  (data || []).forEach((row) => {
    const cat = row.category || "Uncategorized";
    const amt = Number(row.amount) || 0;
    totals[cat] = (totals[cat] || 0) + amt;
  });

  return totals;
}

export async function getSpendingByEmotion() {
  const { data, error } = await supabase
    .from("expenses")
    .select("emotion, amount");

  if (error) {
    console.error("Get spending by emotion error:", error.message);
    throw error;
  }

  const totals = {};
  (data || []).forEach((row) => {
    const emo = row.emotion || "Unknown";
    const amt = Number(row.amount) || 0;
    totals[emo] = (totals[emo] || 0) + amt;
  });

  return totals;
}

export async function updateExpense(id, fields) {
  const { data, error } = await supabase
    .from("expenses")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update expense error:", error.message);
    throw error;
  }
  return data;
}
