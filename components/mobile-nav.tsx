"use client";
import { Home, Gavel, UserRound } from "lucide-react";
const links=[{href:"/",label:"Home",icon:Home},{href:"/my-auctions",label:"Auctions",icon:Gavel},{href:"/",label:"Profile",icon:UserRound}];
export default function MobileNav(){return <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><div className="mx-auto flex h-16 max-w-md items-center justify-around">{links.map(({href,label,icon:Icon})=><a key={label} href={href} className="flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary"><Icon className="size-5"/><span>{label}</span></a>)}</div></nav>}
