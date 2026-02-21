"use client"

import { Zap } from "lucide-react"

export function AuthBranding() {
  return (
    <div className="hidden lg:flex lg:flex-1 flex-col justify-between bg-primary p-10 text-primary-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
          <Zap className="size-4" />
        </div>
        <span className="text-lg font-bold font-[family-name:var(--font-heading)]">
          WordFlow
        </span>
      </div>

      {/* Mockup Preview */}
      <div className="flex flex-col gap-8">
        {/* Sentence typing preview */}
        <div className="rounded-xl bg-primary-foreground/10 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-4">
            Learn words in real sentences
          </p>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              {'우리는 분기별 보고서를 '}
              <strong className="text-primary-foreground">{"\"제출해야\""}</strong>
              {' 합니다.'}
            </p>
            <p className="text-lg text-primary-foreground leading-relaxed">
              {'We need to '}
              <span className="inline-block rounded-md border-2 border-primary-foreground/30 bg-primary-foreground/10 px-3 py-0.5 font-bold">
                submit
              </span>
              {' the quarterly report.'}
            </p>
          </div>
        </div>

        {/* Stats preview */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">87%</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Accuracy</p>
          </div>
          <div className="flex-1 rounded-lg bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">14</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Day Streak</p>
          </div>
          <div className="flex-1 rounded-lg bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">240+</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Words</p>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div>
        <blockquote className="text-sm leading-relaxed text-primary-foreground/80">
          {"\"Typing words directly into sentences completely changed how I learn English. It feels natural, like real practice.\""}
        </blockquote>
        <p className="mt-3 text-xs text-primary-foreground/50">
          A WordFlow learner
        </p>
      </div>
    </div>
  )
}
