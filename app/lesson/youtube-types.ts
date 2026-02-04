// Make this file a module
export {};

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        events: {
          onStateChange: (event: { data: number }) => void;
        };
      }) => void;
      PlayerState: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
