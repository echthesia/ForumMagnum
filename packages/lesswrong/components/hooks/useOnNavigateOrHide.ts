import { useEffect, useEffectEvent, useLayoutEffect } from 'react';
import { useSubscribedLocation } from '@/lib/routeUtil';

/**
 * Reset transient UI on URL changes, when Activity hides or restores a page,
 * and when the browser restores the page from its back/forward cache.
 */
export function useOnNavigateOrHide(reset: () => void) {
  const location = useSubscribedLocation();
  const resetState = useEffectEvent(reset);

  useLayoutEffect(() => {
    // Reset on restoration too: updates scheduled while an Activity is hidden
    // can be deferred. The restored page should paint with its transient UI closed.
    resetState();
    return () => resetState();
  }, [location?.url]);

  useEffect(() => {
    // A full-document navigation (eg following an external link) can put the
    // page into the browser's back/forward cache, which freezes and later
    // resumes the JS heap as-is. No URL change or Activity transition happens,
    // so without this, UI that was open when the user left stays open when they
    // come back. On iOS Safari this strands link previews: tapping a link fires
    // an emulated mouseover before navigating, and after restoration WebKit no
    // longer sends the mouseleave that would close it.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        resetState();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);
}
