"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import type { PublicSpot, PublicSpotStatus, Severity } from "@/lib/types";

type MapViewProps = {
  spots: PublicSpot[];
};

type PopupSpot = Pick<
  PublicSpot,
  "id" | "title" | "ward" | "address" | "severity" | "status"
>;

type SpotFeatureProperties = {
  id: string;
  title: string;
  ward: string;
  address: string;
  severity: Severity;
  status: PublicSpotStatus;
  statusColor: string;
  severityColor: string;
};

function createPopupContent(spot: PopupSpot) {
  const wrapper = document.createElement("div");
  wrapper.className = "w-64 p-4";

  const ward = document.createElement("p");
  ward.className = "text-sm font-bold text-forest";
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

  const link = document.createElement("a");
  link.className =
    "mt-4 block w-full rounded-md bg-ink px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-700";
  link.href = `/spots/${spot.id}`;
  link.textContent = "View spot →";

  chips.append(severity, status);
  wrapper.append(ward, title, address, chips, link);

  return wrapper;
}

function getSpotFeatureCollection(spots: PublicSpot[]) {
  return {
    type: "FeatureCollection",
    features: spots.map((spot) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [spot.longitude, spot.latitude]
      },
      properties: {
        id: spot.id,
        title: spot.title,
        ward: spot.ward,
        address: spot.address,
        severity: spot.severity,
        status: spot.status,
        statusColor: STATUS_COLORS[spot.status],
        severityColor: SEVERITY_COLORS[spot.severity]
      }
    }))
  } satisfies GeoJSON.FeatureCollection<GeoJSON.Point, SpotFeatureProperties>;
}

function updateSpotSource(map: mapboxgl.Map, spots: PublicSpot[]) {
  const source = map.getSource("spots") as mapboxgl.GeoJSONSource | undefined;

  if (!source) {
    return;
  }

  source.setData(getSpotFeatureCollection(spots));
}

function fitMapToSpots(map: mapboxgl.Map, spots: PublicSpot[]) {
  if (spots.length === 0) {
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  spots.forEach((spot) => bounds.extend([spot.longitude, spot.latitude]));
  map.fitBounds(bounds, {
    padding: 72,
    maxZoom: 13
  });
}

export function MapView({ spots }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const spotsRef = useRef(spots);
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

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    const handleClusterClick = (event: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"]
      });
      const feature = features[0];
      const clusterId = feature?.properties?.cluster_id as number | undefined;
      const geometry = feature?.geometry as GeoJSON.Point | undefined;

      if (typeof clusterId !== "number" || geometry?.type !== "Point") {
        return;
      }

      const source = map.getSource("spots") as mapboxgl.GeoJSONSource;
      const coordinates = geometry.coordinates as [number, number];

      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || typeof zoom !== "number") {
          return;
        }

        map.easeTo({ center: coordinates, zoom });
      });
    };

    const handleSpotClick = (event: mapboxgl.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: ["unclustered-point"]
      })[0];
      const geometry = feature?.geometry as GeoJSON.Point | undefined;
      const properties = feature?.properties as
        | SpotFeatureProperties
        | undefined;

      if (!properties || geometry?.type !== "Point") {
        return;
      }

      new mapboxgl.Popup({ maxWidth: "320px", offset: 18 })
        .setLngLat(geometry.coordinates as [number, number])
        .setDOMContent(createPopupContent(properties))
        .addTo(map);
    };

    const handleLoad = () => {
      map.addSource("spots", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 48
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "spots",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#E85D04",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30],
          "circle-opacity": 0.9
        }
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "spots",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"]
        },
        paint: { "text-color": "#ffffff" }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "spots",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "statusColor"],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      map.on("click", "clusters", handleClusterClick);
      map.on("click", "unclustered-point", handleSpotClick);
      map.on("mouseenter", "clusters", setPointerCursor);
      map.on("mouseleave", "clusters", resetCursor);
      map.on("mouseenter", "unclustered-point", setPointerCursor);
      map.on("mouseleave", "unclustered-point", resetCursor);

      updateSpotSource(map, spotsRef.current);
      fitMapToSpots(map, spotsRef.current);
    };

    map.on("load", handleLoad);

    return () => {
      map.off("load", handleLoad);
      map.off("click", "clusters", handleClusterClick);
      map.off("click", "unclustered-point", handleSpotClick);
      map.off("mouseenter", "clusters", setPointerCursor);
      map.off("mouseleave", "clusters", resetCursor);
      map.off("mouseenter", "unclustered-point", setPointerCursor);
      map.off("mouseleave", "unclustered-point", resetCursor);
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    spotsRef.current = spots;
    const map = mapRef.current;

    if (!map) {
      return;
    }

    updateSpotSource(map, spots);
    fitMapToSpots(map, spots);
  }, [spots]);

  if (!token) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
        Map token missing
      </div>
    );
  }

  return (
    <div className="h-[520px] overflow-hidden rounded-lg border border-warm-border bg-slate-100 shadow-sm">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
