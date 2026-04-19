import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    
    // Use a slight delay or check if the value is different
    const current = window.innerWidth < MOBILE_BREAKPOINT
    if (isMobile !== current) {
      setIsMobile(current)
    }
    
    return () => mql.removeEventListener("change", onChange);
  }, [isMobile])

  return !!isMobile
}
