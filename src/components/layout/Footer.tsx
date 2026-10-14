import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">SkillWatch AI</span>
          <span>•</span>
          <span>Smart India Hackathon 2026 (SIH26245)</span>
        </div>
        <p className="text-[11px] text-slate-400 text-center sm:text-right">
          Ministry of Skill Development & Entrepreneurship (MSDE) — Academic Prototype
        </p>
      </div>
    </footer>
  );
};

