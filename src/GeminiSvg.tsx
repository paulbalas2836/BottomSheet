import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

function SvgComponent() {
  return (
    <Svg width={24} height={24} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 2.667L2.666 16 16 29.334 29.334 16 16 2.666z"
        fill="#4285F4"
      />
    </Svg>
  );
}

export default SvgComponent;
