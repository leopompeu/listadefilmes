export const STREAMING_PROVIDERS = [
  { id: "mubi", label: "MUBI", icon: "/icons/mubi.webp", homeUrl: "https://mubi.com" },
  { id: "max", label: "HBO MAX", icon: "/icons/max.jpg", homeUrl: "https://www.max.com" },
  {
    id: "primevideo",
    label: "Prime Video",
    icon: "/icons/primevideo.png",
    homeUrl: "https://www.primevideo.com",
  },
  {
    id: "netflix",
    label: "Netflix",
    icon: "/icons/netflix.webp",
    homeUrl: "https://www.netflix.com",
  },
  {
    id: "disney",
    label: "Disney +",
    icon: "/icons/disney.jpg",
    homeUrl: "https://www.disneyplus.com",
  },
  {
    id: "appletv",
    label: "Apple TV +",
    icon: "/icons/appletv.jpg",
    homeUrl: "https://tv.apple.com",
  },
  {
    id: "globoplay",
    label: "Globoplay",
    icon: "/icons/globoplay.png",
    homeUrl: "https://globoplay.globo.com",
  },
  {
    id: "paramout",
    label: "Paramount +",
    icon: "/icons/paramout.png",
    homeUrl: "https://www.paramountplus.com",
  },
  {
    id: "crunchyroll",
    label: "Crunchyroll",
    icon: "/icons/crunchyroll.png",
    homeUrl: "https://www.crunchyroll.com",
  },
  {
    id: "youtube",
    label: "Youtube",
    icon: "/icons/youtube.avif",
    homeUrl: "https://www.youtube.com",
  },
  { id: "piracy", label: "Pirataria", icon: "/icons/piracy.png", homeUrl: null },
] as const;

export type StreamingProviderId = (typeof STREAMING_PROVIDERS)[number]["id"];

export function isStreamingProvider(value: string): value is StreamingProviderId {
  return STREAMING_PROVIDERS.some((provider) => provider.id === value);
}
