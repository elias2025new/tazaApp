'use client';
import { useEffect, useState } from 'react';

export function BuildStamp({ commitSha, buildTime }: { commitSha: string; buildTime: string }) {
  const [loc, setLoc] = useState('');

  useEffect(() => {
    const currentLoc = window.location.origin + window.location.pathname;
    setLoc(currentLoc);
    console.log(BUILD STAMP:\nLocation: \nSHA: \nTime: );
  }, [commitSha, buildTime]);

  if (!loc) return null;

  return (
    <div className="fixed bottom-20 right-2 z-[99999] text-[11px] text-white/80 bg-black/70 px-2 py-1.5 rounded pointer-events-none font-mono flex flex-col gap-0.5">
      <span>{loc}</span>
      <span>SHA: {commitSha}</span>
      <span>{buildTime}</span>
    </div>
  );
}