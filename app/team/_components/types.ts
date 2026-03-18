"use client";

export type TeamSummary = {
  title: string;
  description: string;
};

export type TeamMembership = {
  role: "owner" | "seller";
  userId: string;
};

export type TeamMember = {
  _id: string;
  userId: string;
  role: "owner" | "seller";
  name?: string | null;
  email?: string | null;
};

export type TeamInvitation = {
  _id: string;
  email: string;
  status: string;
  token: string;
  createdAt: number;
};
