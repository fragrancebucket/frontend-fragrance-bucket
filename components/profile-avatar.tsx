"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

function initials(name?: string | null) {
  const value = name?.trim();
  if (!value) return null;
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ProfileAvatar({ name, image, className = "" }: { name?: string | null; image?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const label = initials(name);
  if (image && !failed) {
    return <img src={image} alt="" className={`size-full object-cover ${className}`} onError={() => setFailed(true)} />;
  }
  if (label) return <span aria-hidden="true" className={`text-sm font-bold tracking-tight ${className}`}>{label}</span>;
  return <UserRound aria-hidden="true" className={`size-5 ${className}`} />;
}
