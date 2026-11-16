import React from 'react';

export const MarqueeBanner: React.FC = () => {
  const text =
    "VHS CAM ’94 \u00A0/\u00A0 DAZZ D-CLASSIC \u00A0/\u00A0 SUPER 8 DREAM \u00A0/\u00A0 BLADE NEON 2049 \u00A0/\u00A0 HI-8 NOCTURNE \u00A0/\u00A0 CINESTILL 800T \u00A0/\u00A0 BETAMAX ’82 \u00A0/\u00A0 TOKYO ’98 MIST \u00A0/\u00A0 ";

  return (
    <div className="mq select-none" aria-hidden="true">
      <div>
        {text}
        {text}
        {text}
      </div>
    </div>
  );
};

