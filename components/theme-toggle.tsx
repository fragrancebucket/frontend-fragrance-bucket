"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export default function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>{const saved=localStorage.getItem("theme")==="dark";setDark(saved);document.documentElement.classList.toggle("dark",saved)},[]);function toggle(){const next=!dark;setDark(next);localStorage.setItem("theme",next?"dark":"light");document.documentElement.classList.toggle("dark",next)}return <button aria-label="Toggle dark theme" onClick={toggle} className="grid size-11 place-items-center rounded-full border bg-card hover:bg-muted">{dark?<Sun className="size-5"/>:<Moon className="size-5"/>}</button>}
