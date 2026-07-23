import type { Job } from "@/types/job";
import { hasRecruiterContent } from "@/lib/job-db";

type RecruiterMessageSectionProps = {
  job: Job;
};

export function RecruiterMessageSection({ job }: RecruiterMessageSectionProps) {
  if (!hasRecruiterContent(job)) return null;

  return (
    <section className="rounded-2xl border border-gold/25 bg-gradient-to-br from-charcoal via-[#1f1a12] to-[#2d2618] p-5 shadow-gold sm:p-6">
      <h2 className="mb-5 font-serif text-lg font-semibold text-gold-light sm:text-xl">
        採用担当からのメッセージ
      </h2>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {job.recruiterImage ? (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.recruiterImage}
              alt={job.recruiterName ? `${job.recruiterName}の顔写真` : "採用担当者の顔写真"}
              className="h-28 w-28 rounded-full border-4 border-gold/40 object-cover shadow-[0_0_24px_rgba(201,169,98,0.25)] sm:h-32 sm:w-32"
              loading="lazy"
              decoding="async"
              width={128}
              height={128}
            />
          </div>
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-gold/30 bg-black/20 text-3xl text-gold-light/80 sm:h-32 sm:w-32">
            ★
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {job.recruiterName && (
            <p className="font-serif text-xl font-semibold text-white">
              {job.recruiterName}
            </p>
          )}
          {job.recruiterTitle && (
            <p className="mt-1 text-sm font-medium text-gold-light">
              {job.recruiterTitle}
            </p>
          )}
          {job.recruiterMessage && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90 sm:text-base">
              {job.recruiterMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
