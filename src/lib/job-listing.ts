type ListingDateSource = {
  postedAt: string;
  createdAt?: string;
};

export function getJobListingDate(job: ListingDateSource): Date {
  const posted = job.postedAt ? new Date(job.postedAt) : null;
  const created = job.createdAt ? new Date(job.createdAt) : null;

  if (posted && created) {
    return posted > created ? posted : created;
  }

  return posted ?? created ?? new Date(0);
}

export function isNewListingJob(
  job: ListingDateSource,
  now = new Date(),
): boolean {
  const listingDate = getJobListingDate(job);
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 1);
  return listingDate >= cutoff;
}
