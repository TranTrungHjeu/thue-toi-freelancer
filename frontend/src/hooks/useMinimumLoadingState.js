import { useEffect, useState } from "react";

const useMinimumLoadingState = (isLoading, minimumDuration = 700) => {
  const [isDelayActive, setIsDelayActive] = useState(isLoading);

  useEffect(() => {
    let timer = null;

    if (isLoading) {
      timer = window.setTimeout(() => {
        setIsDelayActive(true);
      }, 0);
    } else {
      timer = window.setTimeout(() => {
        setIsDelayActive(false);
      }, minimumDuration);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [isLoading, minimumDuration]);

  return isLoading || isDelayActive;
};

export default useMinimumLoadingState;
