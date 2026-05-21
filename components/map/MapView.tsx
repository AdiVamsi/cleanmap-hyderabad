"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import type { PublicSpot } from "@/lib/types";

type MapViewProps = {
  spots: PublicSpot[];
};

function createMarkerElement(color: string) {
  const element = document.createElement("button");
  element.type = "button";
  element.setAttribute("aria-label", "Cleanup spot");
  element.style.backgroundColor = color;
  element.className =
    "h-5 w-5 rounded-full border-2 border-white shadow-lg ring-4 ring-white/50 transition hover:scale-110";

  return element;
}

function createPopupContent(spot: PublicSpot) {
  const wrapper = document.createElement("div");
  wrapper.className = "w-64 p-4";

  const ward = document.createElement("p");
  ward.className = "text-sm font-bold text-civic";
  ward.textContent = spot.ward;

  const title = document.createElement("h3");
  title.className = "mt-1 text-base font-bold leading-6 text-ink";
  title.textContent = spot.title;

  const address = document.createElement("p");
  address.className = "mt-2 text-sm leading-5 text-slate-600";
  address.textContent = spot.address;

  const chips = document.createElement("div");
  chips.className = "mt-3 flex flex-wrap gap-2";

  const severity = document.createElement("span");
  severity.className = "rounded-full px-2.5 py-1 text-xs font-bold text-white";
  severity.style.backgroundColor = SEVERITY_COLORS[spot.severity];
  severity.textContent = SEVERITY_LABELS[spot.severity];

  const status = document.createElement("span");
  status.className = "rounded-full px-2.5 py-1 text-xs font-bold text-white";
  status.style.backgroundColor = STATUS_COLORS[spot.status];
  status.textContent = STATUS_LABELS[spot.status];

  const soon = document.createElement("p");
  soon.className =
    "mt-4 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500";
  soon.textContent = "Spot page coming soon";

  chips.append(severity, status);
  wrapper.append(ward, title, address, chips, soon);

  return wrapper;
}

export function MapView({ spots }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [78.4867, 17.385],
      zoom: 10.7
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = spots.map((spot) => {
      const marker = new mapboxgl.Marker({
        element: createMarkerElement(STATUS_COLORS[spot.status])
      })
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 18 }).setDOMContent(
            createPopupContent(spot)
          )
        )
        .addTo(map);

      return marker;
    });

    if (spots.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      spots.forEach((spot) => bounds.extend([spot.longitude, spot.latitude]));
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: 13
      });
    }
  }, [spots]);

  if (!token) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
        Map token missing
      </div>
    );
  }

  return (
    <div className="h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
