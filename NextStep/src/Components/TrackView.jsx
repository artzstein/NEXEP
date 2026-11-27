import { recordJobViewLocal } from "../utils/localStore";

/**
 * Call when a candidate clicks "View details".
 * Fire-and-forget: a failed count must never block opening the job.
 */
export function TrackView(jobId) {
  try {
    recordJobViewLocal(jobId);
  } catch {
    // ignore tracking failures
  }
}

/* Usage in your job card:

   import { trackJobView } from "../utils/trackJobView";

   <button onClick={() => {
     trackJobView(item.id);
     navigate(`/jobdetails/${item.id}`);   // your existing navigation
   }}>
     View details
   </button>
*/