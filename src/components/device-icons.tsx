import { Cpu, Monitor, RectangleGoggles, Smartphone, Tablet, Tv, Watch } from "lucide-react";
import { ReactElement } from "react";

const styles = "text-brand-light w-8 h-8";

const deviceIconMap: { [key: string]: ReactElement } = {
  mobile: <Smartphone className={styles} />,
  desktop: <Monitor className={styles} />,
  tablet: <Tablet className={styles} />,
  unknown: <Monitor className={styles} />,
  embedded: <Cpu className={styles} />,
  smarttv: <Tv className={styles} />,
  wearable: <Watch className={styles} />,
  xr: <RectangleGoggles className={styles} />,
};

export default deviceIconMap;