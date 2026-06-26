import React from 'react';
import { Activity, Wrench, ArrowRight } from 'lucide-react';

export default function ResumeCard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFE5FC] via-[#FDFCF8] to-[#E2F5ED] flex items-center justify-center p-8 font-sans">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-8">
        
        {/* Left Column - Profile Card */}
        <div className="w-full md:w-[35%] bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center">
          
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9D72FF] to-[#4D45F5] rounded-full blur-[14px] opacity-40"></div>
            <div className="relative w-32 h-32 bg-[#1A162B] rounded-full flex items-center justify-center border-4 border-[#F3F0FF]">
              <span className="text-white text-4xl font-black tracking-tight">ST</span>
            </div>
          </div>

          <h1 className="text-[28px] font-extrabold text-slate-900 mb-3 tracking-tight">
            Truong Nguyen Son Thao
          </h1>
          
          <div className="bg-[#F0EDFF] text-[#633BFF] font-bold px-4 py-1.5 rounded-full text-[11px] tracking-widest uppercase mb-8">
            Product Designer
          </div>

          <div className="w-full h-[1px] bg-slate-100 mb-8"></div>

          <div className="flex w-full justify-between px-4">
            <div className="text-left">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Experience</p>
              <p className="text-2xl font-black text-slate-900">2+ Yrs</p>
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Projects</p>
              <p className="text-2xl font-black text-slate-900">7+</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-[65%] flex flex-col gap-6">
          
          {/* Core Competencies */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#F0F5FF] rounded-xl flex items-center justify-center text-[#4D45F5]">
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Core Competencies</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <SkillBar title="Product Thinking" percentage={95} />
              <SkillBar title="User Research" percentage={90} />
              <SkillBar title="MVP Strategy" percentage={85} />
              <SkillBar title="Problem Solving" percentage={80} />
            </div>
          </div>

          {/* Professional Toolkit */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#F8F0FF] rounded-xl flex items-center justify-center text-[#9D72FF]">
                <Wrench size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Professional Toolkit</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ToolCard icon="F" name="Figma" desc="PRIMARY DESIGN" color="text-[#4D45F5]" />
              <ToolCard icon="M" name="Figma Make" desc="AUTOMATION" color="text-[#9D72FF]" />
              <ToolCard icon="S" name="Supabase" desc="BACKEND" color="text-[#2DD4BF]" />
              <ToolCard icon="AI" name="Antigravity" desc="CODE ASSISTANT" color="text-[#F43F5E]" />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-2">
            <button className="bg-[#1A162B] hover:bg-[#2D264A] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide transition-colors flex items-center gap-2 shadow-xl shadow-slate-900/20">
              VIEW PROJECT JOURNEY
              <ArrowRight size={18} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

function SkillBar({ title, percentage }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="font-extrabold text-sm text-slate-900">{title}</span>
        <span className="font-bold text-xs text-[#4D45F5]">{percentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#4D45F5] rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ToolCard({ icon, name, desc, color }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-xl font-black mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="font-extrabold text-sm text-slate-900 mb-1">{name}</h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
    </div>
  );
}
